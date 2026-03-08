import { NextRequest, NextResponse } from "next/server";
import { generateWordDocument, validateInputData } from "@/lib/engine/word-generation";
import type { WordSchema } from "@/lib/engine/word-ingestion";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateBuffer: b64, schema, data, skipValidation } = body as {
      templateBuffer: string;
      schema: WordSchema;
      data: Record<string, unknown>;
      skipValidation?: boolean;
    };

    if (!b64 || !schema || !data) {
      return NextResponse.json({ error: "templateBuffer, schema et data sont requis." }, { status: 400 });
    }

    const validation = validateInputData(data, schema);
    if (!skipValidation && !validation.valid) {
      return NextResponse.json({
        error: "Données incomplètes",
        missingRequired: validation.missingRequired,
        warnings: validation.warnings,
      }, { status: 422 });
    }

    const result = generateWordDocument({
      data,
      templateBuffer: Buffer.from(b64, "base64"),
      schema,
    });

    return NextResponse.json({
      success: true,
      filename: result.filename,
      buffer: result.buffer.toString("base64"),
      creditsUsed: result.creditsUsed,
      missingFields: result.missingFields,
      generatedAt: result.generatedAt,
      warnings: validation.warnings,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Erreur : ${err instanceof Error ? err.message : "Erreur inconnue"}` },
      { status: 500 }
    );
  }
}
