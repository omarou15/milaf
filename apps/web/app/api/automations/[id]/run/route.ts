import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// POST /api/automations/[id]/run
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let overrides: Record<string, string> = {};
  try {
    const body = await req.json();
    overrides = body.data ?? {};
  } catch {}

  return NextResponse.json({
    queued: true,
    automationId: params.id,
    overrides,
    timestamp: new Date().toISOString(),
    message: "Exécution demandée. Le résultat sera disponible dans les logs.",
  });
}
