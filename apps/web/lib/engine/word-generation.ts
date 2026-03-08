/**
 * Mi-Laf — Doc Engine Tier 1
 * Word Generation : injecte les données dans un template .docx et retourne le buffer généré
 */

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { WordSchema } from "./word-ingestion";
import { preprocessDocxZip } from "./word-ingestion";

export interface GenerationInput {
  data: Record<string, unknown>;       // données à injecter
  templateBuffer: Buffer;              // buffer du .docx template
  schema: WordSchema;                  // schéma du template
}

export interface GenerationResult {
  buffer: Buffer;
  filename: string;
  creditsUsed: 1;
  missingFields: string[];            // champs requis non fournis
  generatedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  missingRequired: string[];
  warnings: string[];
}

/**
 * Valide les données d'entrée contre le schéma du template
 */
export function validateInputData(
  data: Record<string, unknown>,
  schema: WordSchema
): ValidationResult {
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  for (const field of schema.fields) {
    const value = getNestedValue(data, field.balise);

    if (field.required && (value === undefined || value === null || value === "")) {
      missingRequired.push(field.balise);
    }

    // Validation type date
    if (field.type === "date" && value && typeof value === "string") {
      const d = new Date(value);
      if (isNaN(d.getTime())) {
        warnings.push(`Champ "${field.balise}" : format de date invalide "${value}"`);
      }
    }

    // Validation type number
    if (field.type === "number" && value !== undefined && value !== "") {
      if (isNaN(Number(value))) {
        warnings.push(`Champ "${field.balise}" : valeur numérique attendue, reçu "${value}"`);
      }
    }
  }

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    warnings,
  };
}

/**
 * Résout une valeur imbriquée depuis une balise avec namespace
 * "client.nom" dans { client: { nom: "Dupont" } } → "Dupont"
 * "client.nom" dans { "client.nom": "Dupont" } → "Dupont" (flat aussi)
 */
function getNestedValue(data: Record<string, unknown>, balise: string): unknown {
  // Tentative flat d'abord
  if (balise in data) return data[balise];

  // Tentative nested
  const parts = balise.split(".");
  let current: unknown = data;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Aplatit les données pour docxtemplater
 * Supporte les deux formats : flat {"client.nom": "X"} et nested {client: {nom: "X"}}
 */
function flattenData(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  function flatten(obj: Record<string, unknown>, prefix = "") {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        flatten(value as Record<string, unknown>, fullKey);
        // Garde aussi le niveau intermédiaire pour les boucles docxtemplater
        result[fullKey.split(".")[0]] = obj[fullKey.split(".")[0]];
      } else {
        result[fullKey] = value;
      }
    }
  }

  flatten(data);

  // Fusionne aussi les données originales (pour les boucles #loop)
  return { ...data, ...result };
}

/**
 * Formate une valeur pour l'injection dans le document
 */
function formatValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) return "";

  if (type === "date" && typeof value === "string") {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
  }

  if (type === "number" && !isNaN(Number(value))) {
    return Number(value).toLocaleString("fr-FR");
  }

  return String(value);
}

/**
 * Prépare les données en formatant selon les types du schéma
 */
function prepareData(
  data: Record<string, unknown>,
  schema: WordSchema
): Record<string, unknown> {
  const prepared: Record<string, unknown> = { ...data };

  for (const field of schema.fields) {
    const value = getNestedValue(data, field.balise);
    if (value !== undefined) {
      // Support flat key
      prepared[field.balise] = formatValue(value, field.type);
      // Support nested key
      const parts = field.balise.split(".");
      if (parts.length > 1) {
        let obj = prepared;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]] || typeof obj[parts[i]] !== "object") {
            obj[parts[i]] = {};
          }
          obj = obj[parts[i]] as Record<string, unknown>;
        }
        obj[parts[parts.length - 1]] = formatValue(value, field.type);
      }
    }
  }

  return prepared;
}

/**
 * Pipeline principal : injection des données dans le template Word
 */
export function generateWordDocument(input: GenerationInput): GenerationResult {
  const { data, templateBuffer, schema } = input;

  // 1. Validation des données
  const validation = validateInputData(data, schema);
  const missingFields = validation.missingRequired;

  // 2. Préparation des données (formatage selon les types)
  const preparedData = prepareData(flattenData(data), schema);

  // 3. Chargement du template avec pre-processing des runs fragmentés
  const zip = preprocessDocxZip(new PizZip(templateBuffer));
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // IMPORTANT: spécifier explicitement les délimiteurs {{ }}
    // sans ça, docxtemplater v3 interprète { et } séparément
    delimiters: { start: "{{", end: "}}" },
    nullGetter: (part: { value: string }) => {
      // Retourne chaîne vide pour les champs manquants non requis
      return missingFields.includes(part.value) ? `[${part.value}]` : "";
    },
  });

  // 4. Injection des données
  doc.render(preparedData);

  // 5. Génération du buffer output
  const outputBuffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  // 6. Génération du nom de fichier
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const safeName = schema.templateName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40);
  const filename = `${safeName}_${timestamp}.docx`;

  return {
    buffer: outputBuffer,
    filename,
    creditsUsed: 1,
    missingFields,
    generatedAt: new Date().toISOString(),
  };
}
