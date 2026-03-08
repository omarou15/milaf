/**
 * Tier 3 — Pixel Perfect PDF Generation
 * Cascade : Approche 1 → 2 → 3 (fallback)
 *
 * Approche 1 : Vision IA → coordonnées exactes → pdf-lib overlay
 * Approche 2 : Vision IA → recréer le PDF complet fidèlement
 * Approche 3 : Vision IA → HTML structuré → pdf-lib texte propre
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PixelPerfectField {
  key: string;
  label: string;
  type: "text" | "date" | "number" | "checkbox";
  required?: boolean;
}

export interface PixelPerfectSchema {
  templateName: string;
  fields: PixelPerfectField[];
  pageCount: number;
  description?: string;
}

export interface PixelPerfectResult {
  buffer: string;        // base64
  filename: string;
  approach: 1 | 2 | 3;  // which approach succeeded
  fieldsFilled: number;
  warnings: string[];
}

// ── Approach 1 : Vision → coordonnées → overlay ──────────────────────────────

interface FieldCoordinate {
  key: string;
  value: string;
  page: number;           // 0-indexed
  x: number;              // from left, in PDF points
  y: number;              // from bottom, in PDF points
  fontSize: number;
  fontColor?: { r: number; g: number; b: number };
  maxWidth?: number;
}

async function approach1_overlay(
  pdfBase64: string,
  data: Record<string, string>,
  schema: PixelPerfectSchema,
  anthropicKey: string
): Promise<PixelPerfectResult> {
  // 1a. Ask Claude Vision for exact coordinates
  const coordinatesJson = await askClaudeForCoordinates(pdfBase64, data, schema, anthropicKey);
  if (!coordinatesJson || coordinatesJson.length === 0) {
    throw new Error("Aucune coordonnée détectée");
  }

  // 1b. Load original PDF and overlay text
  const pdfBytes = Buffer.from(pdfBase64, "base64");
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  let filled = 0;
  const warnings: string[] = [];

  for (const coord of coordinatesJson) {
    const page = pages[coord.page];
    if (!page) { warnings.push(`Page ${coord.page} inexistante pour ${coord.key}`); continue; }
    if (!coord.value || coord.value.trim() === "") continue;

    try {
      const { r = 0, g = 0, b = 0 } = coord.fontColor ?? {};
      page.drawText(coord.value, {
        x: coord.x,
        y: coord.y,
        size: coord.fontSize ?? 10,
        font: helvetica,
        color: rgb(r / 255, g / 255, b / 255),
        maxWidth: coord.maxWidth,
      });
      filled++;
    } catch (e: any) {
      warnings.push(`Erreur overlay ${coord.key}: ${e.message}`);
    }
  }

  const resultBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(resultBytes).toString("base64"),
    filename: `${schema.templateName.replace(/\s+/g, "_")}_filled.pdf`,
    approach: 1,
    fieldsFilled: filled,
    warnings,
  };
}

async function askClaudeForCoordinates(
  pdfBase64: string,
  data: Record<string, string>,
  schema: PixelPerfectSchema,
  anthropicKey: string
): Promise<FieldCoordinate[]> {
  // Convert first page of PDF to image for Vision
  // We pass the PDF as a document and ask Claude to analyze its layout
  const dataStr = Object.entries(data)
    .filter(([, v]) => v)
    .map(([k, v]) => `  "${k}": "${v}"`)
    .join("\n");

  const prompt = `Tu es un expert en analyse de documents PDF pour placement de texte.

Je vais te donner un PDF et des données à insérer. Pour chaque champ, donne-moi les coordonnées EXACTES où placer le texte dans le PDF.

Le système de coordonnées PDF :
- Origine (0,0) = coin bas-gauche de la page
- X = distance depuis le bord gauche (en points PDF, 1 point = 1/72 pouce)
- Y = distance depuis le bas (en points PDF)
- Une page A4 fait 595 × 842 points

Les données à insérer :
${dataStr}

Les champs du template :
${schema.fields.map(f => `- ${f.key}: ${f.label}`).join("\n")}

Analyse le PDF et retourne UNIQUEMENT un JSON valide (sans markdown, sans explication) dans ce format exact :
[
  {
    "key": "nom_client",
    "value": "Jean Dupont",
    "page": 0,
    "x": 150.5,
    "y": 650.2,
    "fontSize": 10,
    "fontColor": {"r": 0, "g": 0, "b": 0},
    "maxWidth": 200
  }
]

Règles :
- Identifie les zones de texte vides ou les blancs dans le document
- Place le texte exactement dans les espaces prévus
- Si tu vois un champ déjà rempli, remplace-le
- fontSize typique : 9-12 selon le contexte
- Retourne SEULEMENT le tableau JSON, rien d'autre`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
  const result = await response.json();
  const text = result.content?.[0]?.text ?? "";

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Pas de JSON dans la réponse Claude");
  return JSON.parse(jsonMatch[0]);
}

// ── Approach 2 : Vision → recréer PDF fidèlement ─────────────────────────────

interface RebuiltPage {
  width: number;
  height: number;
  elements: RebuiltElement[];
}

interface RebuiltElement {
  type: "text" | "rect" | "line";
  x: number;
  y: number;
  // text
  content?: string;
  fontSize?: number;
  bold?: boolean;
  color?: { r: number; g: number; b: number };
  maxWidth?: number;
  // rect
  width?: number;
  height?: number;
  fill?: { r: number; g: number; b: number };
  stroke?: { r: number; g: number; b: number };
  strokeWidth?: number;
  // line
  x2?: number;
  y2?: number;
}

async function approach2_rebuild(
  pdfBase64: string,
  data: Record<string, string>,
  schema: PixelPerfectSchema,
  anthropicKey: string
): Promise<PixelPerfectResult> {
  const dataStr = Object.entries(data)
    .filter(([, v]) => v)
    .map(([k, v]) => `"${k}": "${v}"`)
    .join(", ");

  const prompt = `Tu es un expert en reconstruction de PDF.

Analyse ce PDF et recrée-le entièrement avec les données suivantes insérées aux bons endroits :
${dataStr}

Retourne UNIQUEMENT un JSON valide (sans markdown) dans ce format :
{
  "pages": [
    {
      "width": 595,
      "height": 842,
      "elements": [
        {"type": "rect", "x": 0, "y": 0, "width": 595, "height": 842, "fill": {"r": 255, "g": 255, "b": 255}},
        {"type": "text", "x": 50, "y": 780, "content": "DEVIS", "fontSize": 18, "bold": true, "color": {"r": 0, "g": 0, "b": 0}},
        {"type": "line", "x": 50, "y": 760, "x2": 545, "y2": 760, "strokeWidth": 0.5, "stroke": {"r": 200, "g": 200, "b": 200}},
        {"type": "text", "x": 50, "y": 720, "content": "Client : Jean Dupont", "fontSize": 10, "color": {"r": 50, "g": 50, "b": 50}}
      ]
    }
  ]
}

Reproduis fidèlement la structure visuelle du document original (titres, tableaux, lignes, mise en page).
Insère les valeurs des champs aux endroits appropriés.
Retourne SEULEMENT le JSON.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
  const result = await response.json();
  const text = result.content?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Pas de JSON dans la réponse");

  const layout = JSON.parse(jsonMatch[0]) as { pages: RebuiltPage[] };

  // Build PDF from layout
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let filled = 0;
  for (const pageData of layout.pages) {
    const page = pdfDoc.addPage([pageData.width ?? 595, pageData.height ?? 842]);
    for (const el of pageData.elements ?? []) {
      try {
        if (el.type === "rect") {
          const opts: any = { x: el.x, y: el.y, width: el.width ?? 100, height: el.height ?? 20 };
          if (el.fill) opts.color = rgb(el.fill.r / 255, el.fill.g / 255, el.fill.b / 255);
          if (el.stroke) { opts.borderColor = rgb(el.stroke.r / 255, el.stroke.g / 255, el.stroke.b / 255); opts.borderWidth = el.strokeWidth ?? 1; }
          page.drawRectangle(opts);
        } else if (el.type === "line") {
          const c = el.stroke ?? { r: 0, g: 0, b: 0 };
          page.drawLine({ start: { x: el.x, y: el.y }, end: { x: el.x2 ?? el.x, y: el.y2 ?? el.y }, thickness: el.strokeWidth ?? 1, color: rgb(c.r / 255, c.g / 255, c.b / 255) });
        } else if (el.type === "text" && el.content) {
          const c = el.color ?? { r: 0, g: 0, b: 0 };
          page.drawText(el.content, {
            x: el.x, y: el.y, size: el.fontSize ?? 10,
            font: el.bold ? fontBold : fontRegular,
            color: rgb(c.r / 255, c.g / 255, c.b / 255),
            maxWidth: el.maxWidth,
          });
          filled++;
        }
      } catch {}
    }
  }

  const bytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(bytes).toString("base64"),
    filename: `${schema.templateName.replace(/\s+/g, "_")}_rebuilt.pdf`,
    approach: 2,
    fieldsFilled: filled,
    warnings: [],
  };
}

// ── Approach 3 : Vision → texte structuré → PDF propre ──────────────────────

async function approach3_structured(
  pdfBase64: string,
  data: Record<string, string>,
  schema: PixelPerfectSchema,
  anthropicKey: string
): Promise<PixelPerfectResult> {
  const dataStr = Object.entries(data)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  // Ask Claude to extract content and merge with data
  const prompt = `Analyse ce PDF et extrais tout son contenu textuel.
Ensuite, fusionne avec ces données :
${dataStr}

Retourne le document complet et fidèle en JSON structuré (sans markdown) :
{
  "title": "Titre du document",
  "sections": [
    {
      "heading": "En-tête (optionnel)",
      "lines": ["Ligne 1", "Ligne 2", "Nom: Jean Dupont"]
    }
  ],
  "footer": "Pied de page (optionnel)"
}

Inclus TOUT le contenu du document avec les données fusionnées aux bons endroits.
Retourne SEULEMENT le JSON.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
  const result = await response.json();
  const text = result.content?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Pas de JSON");

  const doc = JSON.parse(jsonMatch[0]) as { title?: string; sections: { heading?: string; lines: string[] }[]; footer?: string };

  // Build clean PDF
  const pdfDoc = await PDFDocument.create();
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const MARGIN = 50, PAGE_W = 595, PAGE_H = 842, LINE_H = 16;

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const newLine = (amount = LINE_H) => {
    y -= amount;
    if (y < MARGIN + 40) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const drawText = (t: string, opts: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
    const { bold = false, size = 10, color = [0.1, 0.1, 0.1] } = opts;
    // Word wrap
    const font = bold ? fontBold : fontReg;
    const maxW = PAGE_W - MARGIN * 2;
    const words = t.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(test, size);
      if (w > maxW && line) {
        page.drawText(line, { x: MARGIN, y, size, font, color: rgb(color[0], color[1], color[2]) });
        newLine(size + 4);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) page.drawText(line, { x: MARGIN, y, size, font, color: rgb(color[0], color[1], color[2]) });
  };

  let filled = 0;

  // Title
  if (doc.title) {
    drawText(doc.title, { bold: true, size: 16, color: [0.1, 0.1, 0.4] });
    newLine(24);
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    newLine(12);
  }

  // Sections
  for (const section of doc.sections ?? []) {
    if (section.heading) {
      drawText(section.heading, { bold: true, size: 11, color: [0.2, 0.2, 0.5] });
      newLine(LINE_H + 4);
    }
    for (const line of section.lines ?? []) {
      if (!line.trim()) { newLine(6); continue; }
      drawText(line, { size: 10 });
      newLine();
      filled++;
    }
    newLine(8);
  }

  // Footer
  if (doc.footer) {
    y = MARGIN + 20;
    page.drawLine({ start: { x: MARGIN, y: y + 8 }, end: { x: PAGE_W - MARGIN, y: y + 8 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
    page.drawText(doc.footer, { x: MARGIN, y, size: 8, font: fontReg, color: rgb(0.5, 0.5, 0.5) });
  }

  const bytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(bytes).toString("base64"),
    filename: `${schema.templateName.replace(/\s+/g, "_")}_structured.pdf`,
    approach: 3,
    fieldsFilled: filled,
    warnings: ["Approche 3 utilisée — mise en page simplifiée"],
  };
}

// ── Main cascade ──────────────────────────────────────────────────────────────

export async function generatePixelPerfect(
  pdfBase64: string,
  data: Record<string, string>,
  schema: PixelPerfectSchema,
  anthropicKey: string
): Promise<PixelPerfectResult> {
  const errors: string[] = [];

  // Try Approach 1
  try {
    console.log("[Tier3] Trying Approach 1: overlay coordinates");
    const result = await approach1_overlay(pdfBase64, data, schema, anthropicKey);
    if (result.fieldsFilled > 0) {
      console.log(`[Tier3] Approach 1 succeeded: ${result.fieldsFilled} fields`);
      return result;
    }
    throw new Error("Aucun champ rempli");
  } catch (e: any) {
    console.warn(`[Tier3] Approach 1 failed: ${e.message}`);
    errors.push(`A1: ${e.message}`);
  }

  // Try Approach 2
  try {
    console.log("[Tier3] Trying Approach 2: full rebuild");
    const result = await approach2_rebuild(pdfBase64, data, schema, anthropicKey);
    if (result.fieldsFilled > 0) {
      console.log(`[Tier3] Approach 2 succeeded: ${result.fieldsFilled} elements`);
      return result;
    }
    throw new Error("Aucun élément généré");
  } catch (e: any) {
    console.warn(`[Tier3] Approach 2 failed: ${e.message}`);
    errors.push(`A2: ${e.message}`);
  }

  // Approach 3 — always succeeds
  console.log("[Tier3] Trying Approach 3: structured text fallback");
  const result = await approach3_structured(pdfBase64, data, schema, anthropicKey);
  result.warnings.unshift(...errors);
  return result;
}

// ── Schema extraction (for ingestion) ────────────────────────────────────────

export async function extractPixelPerfectSchema(
  pdfBase64: string,
  anthropicKey: string
): Promise<PixelPerfectSchema> {
  const prompt = `Analyse ce PDF et identifie tous les champs variables qui pourraient être personnalisés.

Retourne UNIQUEMENT un JSON valide (sans markdown) :
{
  "templateName": "Nom détecté du document",
  "pageCount": 1,
  "description": "Description courte",
  "fields": [
    {"key": "nom_client", "label": "Nom du client", "type": "text", "required": true},
    {"key": "date", "label": "Date", "type": "date", "required": true},
    {"key": "montant", "label": "Montant total", "type": "number", "required": false}
  ]
}

Types disponibles : text, date, number, checkbox
Identifie TOUS les champs potentiellement variables (noms, dates, montants, adresses, numéros...).
Retourne SEULEMENT le JSON.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
  const result = await response.json();
  const text = result.content?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Pas de JSON dans la réponse");
  return JSON.parse(jsonMatch[0]);
}
