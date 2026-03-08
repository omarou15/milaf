import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractPixelPerfectSchema } from "@/lib/engine/pixel-perfect";

export const runtime = "nodejs";
export const maxDuration = 60; // Vision AI takes time

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { pdfBase64, filename } = await req.json();
    if (!pdfBase64) return NextResponse.json({ error: "pdfBase64 manquant" }, { status: 400 });

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return NextResponse.json({ error: "Service IA indisponible" }, { status: 503 });

    const schema = await extractPixelPerfectSchema(pdfBase64, anthropicKey);

    // Use filename as template name fallback
    if (filename && schema.templateName === "Document") {
      schema.templateName = filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    }

    return NextResponse.json({ schema, originalPdfBase64: pdfBase64 });
  } catch (err: any) {
    console.error("[Tier3 ingest]", err);
    return NextResponse.json({ error: err.message ?? "Erreur d'analyse" }, { status: 500 });
  }
}
