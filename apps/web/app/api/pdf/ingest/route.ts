import { NextRequest, NextResponse } from "next/server";
import { ingestPdfTemplate, validatePdfBuffer } from "@/lib/engine/pdf-ingestion";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const nameInput = formData.get("name") as string | null;

    if (!file) return NextResponse.json({ error: "Fichier PDF manquant." }, { status: 400 });

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    if (!isPdf) return NextResponse.json({ error: "Format non supporté. Seuls les fichiers .pdf sont acceptés." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validatePdfBuffer(buffer);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

    const name = nameInput ?? file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
    const schema = await ingestPdfTemplate(buffer, name);

    if (!schema.hasAcroForm) {
      return NextResponse.json({
        error: "Ce PDF ne contient pas de champs AcroForm remplissables. Tier 2 requiert un PDF avec des champs de formulaire. Utilisez Adobe Acrobat, LibreOffice Draw ou PDFescape.io pour en créer.",
        schema,
      }, { status: 422 });
    }

    return NextResponse.json({ schema, pageCount: schema.pageCount, fieldCount: schema.fieldCount });
  } catch (err) {
    console.error("[pdf/ingest]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur d'ingestion PDF" }, { status: 500 });
  }
}
