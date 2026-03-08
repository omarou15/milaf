import { Hono } from "hono";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export const pdfAnalyzeRouter = new Hono();

/**
 * POST /pdf/analyze
 * Body: multipart form-data avec le fichier PDF
 * Retourne: coordonnées, couleurs, textes extraits par PyMuPDF
 */
pdfAnalyzeRouter.post("/", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"] as File;

    if (!file) {
      return c.json({ error: "Fichier PDF manquant" }, 400);
    }

    // Sauvegarder le PDF temporairement
    const tmpDir = os.tmpdir();
    const tmpPdf = path.join(tmpDir, `milaf_${Date.now()}.pdf`);
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(tmpPdf, Buffer.from(arrayBuffer));

    // Lancer le script Python PyMuPDF
    const result = await runPythonAnalysis(tmpPdf);

    // Nettoyer
    fs.unlinkSync(tmpPdf);

    return c.json(result);
  } catch (err: any) {
    console.error("Erreur analyse PDF:", err);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * POST /pdf/analyze/url
 * Body: { url: string }
 * Analyse un PDF depuis une URL (ex: R2 Cloudflare)
 */
pdfAnalyzeRouter.post("/url", async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) return c.json({ error: "URL manquante" }, 400);

    // Télécharger le PDF
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    const tmpPdf = path.join(os.tmpdir(), `milaf_${Date.now()}.pdf`);
    fs.writeFileSync(tmpPdf, buffer);

    const result = await runPythonAnalysis(tmpPdf);
    fs.unlinkSync(tmpPdf);

    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ── Service Python PyMuPDF ────────────────────────────────────────────────────

function runPythonAnalysis(pdfPath: string): Promise<PDFAnalysisResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../services/pdf_analyzer.py");

    const py = spawn("python3", [scriptPath, pdfPath]);
    let output = "";
    let error = "";

    py.stdout.on("data", (d) => (output += d.toString()));
    py.stderr.on("data", (d) => (error += d.toString()));

    py.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python error: ${error}`));
        return;
      }
      try {
        resolve(JSON.parse(output));
      } catch {
        reject(new Error(`Invalid JSON from Python: ${output.slice(0, 200)}`));
      }
    });
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PDFAnalysisResult {
  page_count: number;
  page_width: number;
  page_height: number;
  pages: PageAnalysis[];
}

export interface PageAnalysis {
  page_number: number;
  text_blocks: TextBlock[];
  vector_shapes: VectorShape[];
  images: ImageInfo[];
  colors: ColorInfo[];
}

export interface TextBlock {
  text: string;
  x: number; y: number; w: number; h: number;
  font: string; size: number;
  color_rgb: [number, number, number];
  bold: boolean; italic: boolean;
}

export interface VectorShape {
  index: number;
  x: number; y: number; w: number; h: number;
  fill_rgb: [number, number, number] | null;
  stroke_rgb: [number, number, number] | null;
  stroke_width: number;
}

export interface ImageInfo {
  xref: number; width: number; height: number;
  ext: string; size_bytes: number;
}

export interface ColorInfo {
  rgb: [number, number, number];
  hex: string;
  usage_count: number;
  context: string;
}
