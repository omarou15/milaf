import { Hono } from "hono";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";

export const pdfGenerateRouter = new Hono();

/**
 * POST /pdf/generate
 * Body: { template: string, data: object, options?: object }
 * Génère un PDF pixel-perfect depuis un template + données
 */
pdfGenerateRouter.post("/", async (c) => {
  try {
    const { template, data, options = {} } = await c.req.json();

    if (!template || !data) {
      return c.json({ error: "template et data requis" }, 400 as any);
    }

    // Router vers le bon générateur selon le template
    let pdfBuffer: Buffer;

    switch (template) {
      case "dpe-france":
        pdfBuffer = await generateDPE(data);
        break;
      default:
        return c.json({ error: `Template inconnu: ${template}` }, 400 as any);
    }

    // Retourner le PDF en base64 (pour stockage R2 côté web)
    const base64 = pdfBuffer.toString("base64");

    return c.json({
      success: true,
      pdf_base64: base64,
      size_bytes: pdfBuffer.length,
      template,
    });
  } catch (err: any) {
    console.error("Erreur génération PDF:", err);
    return c.json({ error: err.message }, 500 as any);
  }
});

/**
 * POST /pdf/generate/stream
 * Même chose mais retourne le PDF directement (téléchargement)
 */
pdfGenerateRouter.post("/stream", async (c) => {
  try {
    const { template, data } = await c.req.json();

    let pdfBuffer: Buffer;
    switch (template) {
      case "dpe-france":
        pdfBuffer = await generateDPE(data);
        break;
      default:
        return c.json({ error: `Template inconnu: ${template}` }, 400 as any);
    }

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${template}_${Date.now()}.pdf"`,
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500 as any);
  }
});

// ── Générateurs ───────────────────────────────────────────────────────────────

async function generateDPE(data: any): Promise<Buffer> {
  // Import dynamique du module DPE (dans lib/modules/dpe-france)
  const { genererDPE } = await import(
    path.join(__dirname, "../../web/lib/modules/dpe-france/src/index")
  );
  return genererDPE(data);
}
