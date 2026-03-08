import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import PizZip from "pizzip";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/instant-generate
 * Takes content + data → produces a .docx immediately
 * Body: { wordContent: string, data: Record<string, string>, filename: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { wordContent, data, filename = "document" } = await req.json();
    if (!wordContent) return NextResponse.json({ error: "wordContent manquant" }, { status: 400 });

    // Replace {{tags}} with data
    let content = wordContent;
    for (const [key, value] of Object.entries(data || {})) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
    }

    const docxBuffer = buildDocx(content);
    const base64 = Buffer.from(docxBuffer).toString("base64");

    const safeName = filename
      .toLowerCase()
      .replace(/[^a-z0-9àâéèêëîïôùûüç]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 50);

    return NextResponse.json({
      buffer: base64,
      filename: `${safeName}_${new Date().toISOString().slice(0, 10)}.docx`,
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fieldsFilled: Object.keys(data || {}).length,
    });
  } catch (err: any) {
    console.error("[instant-generate]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildDocx(content: string): Buffer {
  const lines = content.split("\n");
  let body = "";

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("# ")) {
      body += para(t.slice(2), true, 32, 240);
    } else if (t.startsWith("## ")) {
      body += para(t.slice(3), true, 26, 200);
    } else if (t.startsWith("### ")) {
      body += para(t.slice(4), true, 22, 160);
    } else if (t === "---") {
      body += `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="CCCCCC"/></w:pBdr></w:pPr></w:p>`;
    } else if (t === "") {
      body += `<w:p/>`;
    } else {
      // Handle **bold** inline
      const parts = t.split(/(\*\*[^*]+\*\*)/g);
      let runs = "";
      for (const p of parts) {
        if (p.startsWith("**") && p.endsWith("**")) {
          runs += `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${esc(p.slice(2, -2))}</w:t></w:r>`;
        } else if (p) {
          runs += `<w:r><w:t xml:space="preserve">${esc(p)}</w:t></w:r>`;
        }
      }
      body += `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr>${runs}</w:p>`;
    }
  }

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const zip = new PizZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.folder("word")!.folder("_rels")!.file("document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);
  zip.folder("word")!.file("document.xml", docXml);

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}

function para(text: string, bold: boolean, size: number, spacing: number): string {
  return `<w:p><w:pPr><w:spacing w:after="${spacing}"/></w:pPr><w:r><w:rPr>${bold ? "<w:b/>" : ""}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}
