import { NextRequest, NextResponse } from "next/server";
import { ingestWordTemplate, validateDocxBuffer } from "@/lib/engine/word-ingestion";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || "Sans titre";

    if (!file) {
      return NextResponse.json({ error: "Fichier manquant. Envoyez un fichier .docx dans le champ 'file'." }, { status: 400 });
    }

    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx");

    if (!isDocx) {
      return NextResponse.json({ error: `Format non supporté. Seuls les fichiers .docx sont acceptés.` }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: `Fichier trop volumineux. Maximum : 10 Mo.` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const validation = validateDocxBuffer(buffer);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const schema = ingestWordTemplate(buffer, name);

    return NextResponse.json({
      success: true,
      schema,
      meta: { filename: file.name, size: file.size, processedAt: new Date().toISOString() },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Erreur : ${err instanceof Error ? err.message : "Erreur inconnue"}` },
      { status: 500 }
    );
  }
}
