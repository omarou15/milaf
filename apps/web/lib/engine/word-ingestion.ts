/**
 * Mi-Laf — Doc Engine Tier 1
 * Word Ingestion : analyse un .docx balisé {{champs}} et retourne le schéma JSON
 */

import PizZip from "pizzip";

/**
 * Répare les runs XML fragmentés dans un paragraphe docx.
 * 
 * Word fragmente les balises {{champ}} sur plusieurs <w:r> consécutifs :
 *   <w:r><w:t>{{</w:t></w:r><w:r><w:t>client</w:t></w:r><w:r><w:t>.nom}}</w:t></w:r>
 * 
 * Ce pre-processing :
 * 1. Extrait le texte plat de chaque paragraphe
 * 2. Détecte les balises fragmentées entre plusieurs runs
 * 3. Reconstruit les runs en s'assurant que chaque {{ }} est dans un seul <w:t>
 */
export function mergeFragmentedRuns(xml: string): string {
  return xml.replace(
    /(<w:p\b[^>]*>)([\s\S]*?)(<\/w:p>)/g,
    (_full: string, pOpen: string, pBody: string, pClose: string) => {
      // Collecter les infos de tous les runs du paragraphe
      interface RunInfo { text: string; rPr: string }
      const runInfos: RunInfo[] = [];
      const runRx = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g;
      let rm: RegExpExecArray | null;
      while ((rm = runRx.exec(pBody)) !== null) {
        const xml = rm[0];
        const tM = xml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/);
        const rPrM = xml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
        runInfos.push({ text: tM ? tM[1] : "", rPr: rPrM ? rPrM[0] : "" });
      }

      const flat = runInfos.map((r) => r.text).join("");
      if (!flat.includes("{")) return _full;

      // Vérifier si des balises sont fragmentées entre plusieurs runs
      const hasFragmentation = runInfos.some((r) => {
        const opens = (r.text.match(/\{/g) || []).length;
        const closes = (r.text.match(/\}/g) || []).length;
        return opens !== closes;
      });
      if (!hasFragmentation) return _full;

      // Segmenter le texte plat en tokens : texte normal | balise {{ }}
      const tokens: Array<{ t: "text" | "tag"; v: string }> = [];
      let rem = flat;
      while (rem.length > 0) {
        const s = rem.indexOf("{{");
        if (s === -1) { tokens.push({ t: "text", v: rem }); break; }
        if (s > 0) tokens.push({ t: "text", v: rem.slice(0, s) });
        const e = rem.indexOf("}}", s + 2);
        if (e === -1) { tokens.push({ t: "text", v: rem }); break; }
        tokens.push({ t: "tag", v: rem.slice(s, e + 2) });
        rem = rem.slice(e + 2);
      }

      // Reconstruire les runs avec les tokens
      const pPrM = pBody.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
      const pPr = pPrM ? pPrM[0] : "";
      const firstRPr = runInfos.find((r) => r.rPr)?.rPr ?? "";

      const newRuns = tokens
        .filter((tk) => tk.v.length > 0)
        .map((tk) => {
          const needsPreserve = tk.v.startsWith(" ") || tk.v.endsWith(" ");
          const attr = needsPreserve ? ' xml:space="preserve"' : "";
          return `<w:r>${firstRPr}<w:t${attr}>${tk.v}</w:t></w:r>`;
        });

      return `${pOpen}${pPr}${newRuns.join("")}${pClose}`;
    }
  );
}

/**
 * Applique le merge des runs sur tous les fichiers XML pertinents d'un zip
 */
export function preprocessDocxZip(zip: PizZip): PizZip {
  const filesToProcess = [
    "word/document.xml",
    "word/header1.xml",
    "word/header2.xml", 
    "word/footer1.xml",
    "word/footer2.xml",
  ];
  
  for (const filename of filesToProcess) {
    const file = zip.file(filename);
    if (file) {
      const original = file.asText();
      const processed = mergeFragmentedRuns(original);
      zip.file(filename, processed);
    }
  }
  
  return zip;
}

export type FieldType = "text" | "number" | "date" | "boolean" | "select";

export interface DetectedField {
  balise: string;       // ex: "client.nom"
  label: string;        // ex: "Client - Nom"
  type: FieldType;
  required: boolean;
  group: string;        // ex: "client", "chantier", "travaux"
  hint?: string;        // suggestion contextuelle
}

export interface WordSchema {
  templateName: string;
  tier: "tier1_word";
  fields: DetectedField[];
  rawBalises: string[];
  fieldCount: number;
  groups: string[];
  warnings: string[];
}

/**
 * Détecte tous les champs {{balise}} dans un buffer .docx
 * Utilise une extraction directe du XML brut (regex sur le texte plat),
 * sans passer par Docxtemplater, pour éviter les problèmes de délimiteurs.
 */
export function extractBalises(buffer: Buffer): string[] {
  const zip = new PizZip(buffer);
  const filesToScan = [
    "word/document.xml",
    "word/header1.xml",
    "word/header2.xml",
    "word/footer1.xml",
    "word/footer2.xml",
  ];

  const found = new Set<string>();
  const BALISE_REGEX = /\{\{([^{}]+)\}\}/g;

  for (const filename of filesToScan) {
    const file = zip.file(filename);
    if (!file) continue;

    // Extraire le texte plat en joinant tous les <w:t>
    const xmlContent = file.asText();
    const flatText = (xmlContent.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [])
      .map((t) => t.replace(/<[^>]+>/g, ""))
      .join("");

    let match: RegExpExecArray | null;
    BALISE_REGEX.lastIndex = 0;
    while ((match = BALISE_REGEX.exec(flatText)) !== null) {
      const raw = match[1].trim();
      // Ignorer les balises de boucle docxtemplater (#, /, @)
      if (!raw.startsWith("#") && !raw.startsWith("/") && !raw.startsWith("@")) {
        found.add(raw);
      }
    }
  }

  return Array.from(found).sort();
}

/**
 * Infère le type d'un champ à partir de son nom
 */
function inferType(balise: string): FieldType {
  const lower = balise.toLowerCase();
  if (/date|le\b|du\b/.test(lower)) return "date";
  if (/montant|prix|total|ht|ttc|tva|cout|tarif|surface|puissance|kwh|kw\b/.test(lower)) return "number";
  if (/oui_non|bool|checkbox|cocher|confirm/.test(lower)) return "boolean";
  if (/type\b|categorie|nature|mode|statut|civilite/.test(lower)) return "select";
  return "text";
}

/**
 * Extrait le groupe d'un champ (première partie avant le point)
 */
function extractGroup(balise: string): string {
  const parts = balise.split(".");
  if (parts.length > 1) return parts[0];
  // Heuristique sur le nom si pas de namespace
  const lower = balise.toLowerCase();
  if (/client|beneficiaire|proprietaire|locataire|occupant/.test(lower)) return "client";
  if (/chantier|adresse|logement|batiment|site/.test(lower)) return "chantier";
  if (/travaux|operation|prestation|pose|installation/.test(lower)) return "travaux";
  if (/entreprise|installateur|societe|rge/.test(lower)) return "entreprise";
  if (/date|periode|delai/.test(lower)) return "dates";
  if (/montant|prix|total|ht|ttc|tva|cout/.test(lower)) return "financier";
  return "general";
}

/**
 * Génère un label lisible depuis une balise
 * "client.nom_complet" → "Client - Nom Complet"
 */
function generateLabel(balise: string): string {
  const parts = balise.split(".");
  const name = parts[parts.length - 1];
  const group = parts.length > 1 ? parts[0] : null;

  const humanize = (s: string) =>
    s.replace(/_/g, " ")
     .replace(/\b\w/g, (c) => c.toUpperCase());

  if (group) {
    return `${humanize(group)} — ${humanize(name)}`;
  }
  return humanize(name);
}

/**
 * Génère un hint contextuel pour aider l'utilisateur à mapper le champ
 */
function generateHint(balise: string): string | undefined {
  const lower = balise.toLowerCase();
  if (lower.includes("siret")) return "Numéro SIRET 14 chiffres";
  if (lower.includes("rge")) return "Numéro de certification RGE de l'entreprise";
  if (lower.includes("tva")) return "Taux ou montant TVA applicable";
  if (lower.includes("surface")) return "En m²";
  if (lower.includes("puissance")) return "En kWh ou kW";
  if (lower.includes("code_postal") || lower.includes("cp")) return "Code postal 5 chiffres";
  return undefined;
}

/**
 * Pipeline principal : Buffer .docx → WordSchema
 */
export function ingestWordTemplate(
  buffer: Buffer,
  templateName: string = "Sans titre"
): WordSchema {
  const warnings: string[] = [];

  // 1. Extraction des balises brutes
  let rawBalises: string[];
  try {
    rawBalises = extractBalises(buffer);
  } catch (err) {
    throw new Error(`Impossible de lire le fichier Word : ${err}`);
  }

  if (rawBalises.length === 0) {
    warnings.push("Aucune balise {{champ}} détectée. Vérifiez que votre document contient des balises au format {{nom_du_champ}}.");
  }

  // 2. Construction des champs enrichis
  const fields: DetectedField[] = rawBalises.map((balise) => ({
    balise,
    label: generateLabel(balise),
    type: inferType(balise),
    required: true, // défaut : tous requis, l'utilisateur peut modifier
    group: extractGroup(balise),
    hint: generateHint(balise),
  }));

  // 3. Déduplication des groupes
  const groups = Array.from(new Set(fields.map((f) => f.group))).sort();

  // 4. Warnings supplémentaires
  if (fields.length > 50) {
    warnings.push(`Document complexe : ${fields.length} champs détectés. Pensez à utiliser des namespaces (ex: client.nom).`);
  }

  const ungrouped = fields.filter((f) => f.group === "general");
  if (ungrouped.length > 5) {
    warnings.push(`${ungrouped.length} champs sans namespace détectés. Recommandé : utiliser {{groupe.champ}} pour une meilleure organisation.`);
  }

  return {
    templateName,
    tier: "tier1_word",
    fields,
    rawBalises,
    fieldCount: fields.length,
    groups,
    warnings,
  };
}

/**
 * Valide qu'un buffer est bien un .docx valide
 */
export function validateDocxBuffer(buffer: Buffer): { valid: boolean; error?: string } {
  try {
    const zip = new PizZip(buffer);
    const hasDocument = !!zip.file("word/document.xml");
    if (!hasDocument) {
      return { valid: false, error: "Le fichier ne contient pas de document Word valide (word/document.xml manquant)" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Fichier corrompu ou format non supporté. Seuls les fichiers .docx sont acceptés." };
  }
}
