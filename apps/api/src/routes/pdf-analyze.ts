import { Hono } from "hono";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export const pdfAnalyzeRouter = new Hono();

/**
 * POST /pdf/analyze
 * Accepts EITHER:
 *   - multipart form-data with "file" field (File)
 *   - JSON body with { pdfBase64: string, filename?: string }
 * Returns: PyMuPDF analysis (coordinates, colors, text blocks, shapes)
 */
pdfAnalyzeRouter.post("/", async (c) => {
  try {
    const contentType = c.req.header("content-type") || "";
    let tmpPdf: string;

    if (contentType.includes("multipart/form-data")) {
      // Multipart file upload
      const body = await c.req.parseBody();
      const file = body["file"] as File;
      if (!file) {
        return c.json({ error: "Fichier PDF manquant (champ 'file')" }, 400 as any);
      }
      tmpPdf = path.join(os.tmpdir(), `milaf_${Date.now()}.pdf`);
      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(tmpPdf, Buffer.from(arrayBuffer));
    } else {
      // JSON with base64
      const { pdfBase64 } = await c.req.json();
      if (!pdfBase64) {
        return c.json({ error: "pdfBase64 manquant" }, 400 as any);
      }
      tmpPdf = path.join(os.tmpdir(), `milaf_${Date.now()}.pdf`);
      // Handle data URL prefix if present
      const raw = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      fs.writeFileSync(tmpPdf, Buffer.from(raw, "base64"));
    }

    const result = await runPythonAnalysis(tmpPdf);

    // Cleanup
    try { fs.unlinkSync(tmpPdf); } catch {}

    return c.json(result);
  } catch (err: any) {
    console.error("Erreur analyse PDF:", err);
    return c.json({ error: err.message }, 500 as any);
  }
});

/**
 * POST /pdf/analyze/url
 * Body: { url: string }
 */
pdfAnalyzeRouter.post("/url", async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) return c.json({ error: "URL manquante" }, 400 as any);

    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    const tmpPdf = path.join(os.tmpdir(), `milaf_${Date.now()}.pdf`);
    fs.writeFileSync(tmpPdf, buffer);

    const result = await runPythonAnalysis(tmpPdf);
    try { fs.unlinkSync(tmpPdf); } catch {}

    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 500 as any);
  }
});

// ── Python runner ─────────────────────────────────────────────────────────────

function runPythonAnalysis(pdfPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Try multiple paths for the Python script
    const candidates = [
      path.join(__dirname, "../services/pdf_analyzer.py"),
      path.join(__dirname, "../../src/services/pdf_analyzer.py"),
      path.join(process.cwd(), "src/services/pdf_analyzer.py"),
      path.join(process.cwd(), "dist/services/pdf_analyzer.py"),
    ];

    let scriptPath = candidates[0];
    for (const c of candidates) {
      if (fs.existsSync(c)) { scriptPath = c; break; }
    }

    console.log(`[PyMuPDF] Using script: ${scriptPath}`);
    console.log(`[PyMuPDF] Analyzing: ${pdfPath} (${fs.statSync(pdfPath).size} bytes)`);

    const py = spawn("python3", [scriptPath, pdfPath]);
    let output = "";
    let error = "";

    py.stdout.on("data", (d) => (output += d.toString()));
    py.stderr.on("data", (d) => (error += d.toString()));

    py.on("close", (code) => {
      if (code !== 0) {
        console.error(`[PyMuPDF] Error (code ${code}):`, error);
        reject(new Error(`Python error: ${error.slice(0, 500)}`));
        return;
      }
      try {
        const parsed = JSON.parse(output);
        console.log(`[PyMuPDF] Success: ${parsed.page_count} pages, ${parsed.pages?.[0]?.text_blocks?.length || 0} text blocks`);
        resolve(parsed);
      } catch {
        reject(new Error(`Invalid JSON from Python: ${output.slice(0, 200)}`));
      }
    });
  });
}
