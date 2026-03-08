import { NextRequest, NextResponse } from "next/server";
import { generatePdfDocument } from "@/lib/engine/pdf-generation";
import type { PdfSchema } from "@/lib/engine/pdf-ingestion";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateBuffer, schema, data, flattenForm } = body as {
      templateBuffer: string;
      schema: PdfSchema;
      data: Record<string, string>;
      flattenForm?: boolean;
    };

    if (!templateBuffer) return NextResponse.json({ error: "templateBuffer manquant" }, { status: 400 });
    if (!schema) return NextResponse.json({ error: "schema manquant" }, { status: 400 });
    if (!data) return NextResponse.json({ error: "data manquant" }, { status: 400 });

    const result = await generatePdfDocument({ templateBuffer, schema, data, flattenForm });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[pdf/generate]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur de génération PDF" }, { status: 500 });
  }
}
