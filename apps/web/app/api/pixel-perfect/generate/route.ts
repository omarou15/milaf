import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generatePixelPerfect } from "@/lib/engine/pixel-perfect";
import type { PixelPerfectSchema } from "@/lib/engine/pixel-perfect";

export const runtime = "nodejs";
export const maxDuration = 120; // Vision + generation can take up to 2 min

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { pdfBase64, schema, data } = await req.json() as {
      pdfBase64: string;
      schema: PixelPerfectSchema;
      data: Record<string, string>;
    };

    if (!pdfBase64) return NextResponse.json({ error: "pdfBase64 manquant" }, { status: 400 });
    if (!schema) return NextResponse.json({ error: "schema manquant" }, { status: 400 });
    if (!data) return NextResponse.json({ error: "data manquant" }, { status: 400 });

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return NextResponse.json({ error: "Service IA indisponible" }, { status: 503 });

    const result = await generatePixelPerfect(pdfBase64, data, schema, anthropicKey);

    return NextResponse.json({
      buffer: result.buffer,
      filename: result.filename,
      approach: result.approach,
      approachLabel: ["", "Overlay coordonnées", "Reconstruction complète", "Texte structuré"][result.approach],
      fieldsFilled: result.fieldsFilled,
      warnings: result.warnings,
    });
  } catch (err: any) {
    console.error("[Tier3 generate]", err);
    return NextResponse.json({ error: err.message ?? "Erreur de génération" }, { status: 500 });
  }
}
