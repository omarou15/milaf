import { NextRequest, NextResponse } from "next/server";
import { getModuleTemplates, MODULES_REGISTRY } from "@/lib/modules/registry";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const moduleId = req.nextUrl.searchParams.get("id");

  // List all modules
  if (!moduleId) {
    return NextResponse.json({ modules: MODULES_REGISTRY });
  }

  const mod = MODULES_REGISTRY.find(m => m.id === moduleId);
  if (!mod) return NextResponse.json({ error: "Module introuvable" }, { status: 404 });

  const templates = getModuleTemplates(moduleId);
  if (templates.length === 0) {
    return NextResponse.json({
      moduleId,
      templates: [],
      message: "Ce module est en cours de développement.",
    });
  }

  // Return schemas ready to be saved as localStorage templates
  const installable = templates.map(t => ({
    id: `${moduleId}-${t.id}-${Date.now()}`,
    schema: t.schema,
    templateB64: "", // Word templates: no base64 needed for schema-only storage
    createdAt: new Date().toISOString(),
    moduleId,
    emoji: t.emoji,
  }));

  return NextResponse.json({ moduleId, templates: installable });
}
