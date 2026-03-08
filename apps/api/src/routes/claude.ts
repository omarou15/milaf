import { Hono } from "hono";

export const claudeRouter = new Hono();

const CLAUDE_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

/**
 * POST /claude/stream
 * Proxy vers Claude API avec streaming SSE
 */
claudeRouter.post("/stream", async (c) => {
  try {
    const { messages, system, max_tokens = 4096 } = await c.req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return c.json({ error: "ANTHROPIC_API_KEY non configurée" }, 500 as any);
    }

    const body: any = {
      model: MODEL,
      max_tokens,
      stream: true,
      messages,
    };
    if (system) body.system = system;

    const upstream = await fetch(CLAUDE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return c.json({ error: err }, upstream.status as any);
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500 as any);
  }
});

/**
 * POST /claude/analyze-pdf
 * Takes PyMuPDF analysis → Claude detects variable fields + generates renderer
 * Body: { analysis: PDFAnalysisResult, target_page: number, template_name: string }
 */
claudeRouter.post("/analyze-pdf", async (c) => {
  try {
    const { analysis, target_page = 1, template_name } = await c.req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return c.json({ error: "ANTHROPIC_API_KEY manquante" }, 500 as any);

    const pageData = analysis.pages?.[target_page - 1];
    if (!pageData) return c.json({ error: `Page ${target_page} non trouvée` }, 400 as any);

    const system = `Tu es un expert en génération de PDF pixel-perfect avec pdf-lib en TypeScript.
Tu reçois l'analyse PyMuPDF d'une page PDF (coordonnées exactes, couleurs RGB, textes, formes vectorielles).

TON TRAVAIL EN 2 PARTIES :

PARTIE 1 — DÉTECTION DES CHAMPS VARIABLES
Analyse tous les text_blocks et identifie ceux qui contiennent des données variables (noms, dates, montants, adresses, numéros...).
Pour chaque champ variable détecté, génère une entrée dans le JSON suivant :

<milaf_fields>
[
  {"key": "nom_client", "label": "Nom du client", "type": "text", "page": 1, "x": 100, "y": 200, "original_text": "M. Jean Dupont"},
  {"key": "date_facture", "label": "Date de facture", "type": "date", "page": 1, "x": 400, "y": 50, "original_text": "15/03/2026"}
]
</milaf_fields>

Types possibles : text, date, number, email, tel, textarea, select
Règles :
- Les en-têtes, labels, titres NE SONT PAS des champs variables
- Les données qui changent d'un document à l'autre SONT des champs variables
- Utilise des snake_case pour les keys
- Inclus les coordonnées x,y exactes du text_block original

PARTIE 2 — CODE RENDERER
Génère le code TypeScript pdf-lib qui reproduit cette page à l'identique.
Les champs variables doivent utiliser \`data.nom_du_champ\` au lieu du texte en dur.

Règles du code :
- Coordonnées exactes telles que fournies (système pdf-lib: origine bas-gauche, convertis y)
- Page height: ${analysis.page_height}
- Couleurs RGB converties en rgb(r/255, g/255, b/255)
- Utilise StandardFonts (Helvetica, Courier, TimesRoman)
- Code compilable immédiatement, zéro pseudo-code
- Export: \`export async function renderPage(pdfDoc: PDFDocument, page: PDFPage, data: Record<string, string>): Promise<void>\`

STRUCTURE RÉPONSE :
1. D'abord le bloc <milaf_fields>...</milaf_fields>
2. Puis le code TypeScript dans un bloc \`\`\`typescript ... \`\`\``;

    // Truncate analysis if too large
    const analysisStr = JSON.stringify(pageData, null, 2);
    const truncated = analysisStr.length > 12000 ? analysisStr.slice(0, 12000) + "\n... (truncated)" : analysisStr;

    const userMessage = `Analyse la page ${target_page} du document "${template_name}".

DIMENSIONS : ${analysis.page_width} x ${analysis.page_height} pts
TEXTES : ${pageData.text_blocks.length} blocs
FORMES : ${pageData.vector_shapes.length} formes vectorielles
IMAGES : ${pageData.images.length} images

DONNÉES EXTRAITES :

${truncated}`;

    console.log(`[Claude] Analyzing page ${target_page} of "${template_name}" (${pageData.text_blocks.length} text blocks)`);

    const response = await fetch(CLAUDE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        system,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Claude] API error:", err);
      return c.json({ error: `Claude API error: ${err.slice(0, 200)}` }, 502 as any);
    }

    const result = await response.json() as any;
    const fullText = result.content?.[0]?.text || "";

    // Parse fields from <milaf_fields> block
    let fields: any[] = [];
    const fieldsMatch = fullText.match(/<milaf_fields>([\s\S]*?)<\/milaf_fields>/);
    if (fieldsMatch) {
      try {
        fields = JSON.parse(fieldsMatch[1].trim());
      } catch (e) {
        console.warn("[Claude] Failed to parse milaf_fields:", e);
      }
    }

    // Extract TypeScript code
    const codeMatch = fullText.match(/```typescript\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : "";

    console.log(`[Claude] Detected ${fields.length} fields, code: ${code.length} chars`);

    return c.json({
      success: true,
      fields,
      code,
      tokens_used: result.usage,
      raw_response_length: fullText.length,
    });
  } catch (err: any) {
    console.error("[Claude] Error:", err);
    return c.json({ error: err.message }, 500 as any);
  }
});
