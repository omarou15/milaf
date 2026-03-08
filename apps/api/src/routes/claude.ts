import { Hono } from "hono";

export const claudeRouter = new Hono();

const CLAUDE_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

/**
 * POST /claude/stream
 * Proxy vers Claude API avec streaming SSE
 * Body: { messages: [], system?: string, max_tokens?: number }
 * Utilise la clé API serveur Mi-Laf (pas BYOK)
 */
claudeRouter.post("/stream", async (c) => {
  try {
    const { messages, system, max_tokens = 4096 } = await c.req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return c.json({ error: "ANTHROPIC_API_KEY non configurée" }, 500);
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
      return c.json({ error: err }, upstream.status);
    }

    // Pass-through du stream SSE
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/**
 * POST /claude/analyze-pdf
 * Analyse un PDF extrait et génère le code pdf-lib correspondant
 * Body: { analysis: PDFAnalysisResult, target_page: number, template_name: string }
 */
claudeRouter.post("/analyze-pdf", async (c) => {
  try {
    const { analysis, target_page = 1, template_name } = await c.req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return c.json({ error: "ANTHROPIC_API_KEY manquante" }, 500);

    const pageData = analysis.pages[target_page - 1];

    const system = `Tu es un expert en génération de PDF pixel-perfect avec pdf-lib en TypeScript.
Tu reçois l'analyse PyMuPDF d'une page PDF (coordonnées exactes, couleurs RGB, textes, formes).
Tu génères le code TypeScript pdf-lib qui reproduit cette page à l'identique.
Règles :
- Coordonnées exactes telles que fournies (système pdf-lib: origine bas-gauche)
- Couleurs RGB converties en rgb(r/255, g/255, b/255)
- Polices IBM Plex Sans depuis assets/fonts/ via fs.readFileSync
- Code compilable immédiatement, zéro pseudo-code
- Fonction export async function renderPage(pdfDoc: PDFDocument, data: any): Promise<void>`;

    const userMessage = `Génère le renderer TypeScript pdf-lib pour la page ${target_page} du template "${template_name}".

DONNÉES EXTRAITES (${pageData.text_blocks.length} textes, ${pageData.vector_shapes.length} formes) :

${JSON.stringify(pageData, null, 2).slice(0, 8000)}`;

    const response = await fetch(CLAUDE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8096,
        system,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const result = await response.json() as any;
    const code = result.content?.[0]?.text || "";

    return c.json({ success: true, code, tokens_used: result.usage });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
