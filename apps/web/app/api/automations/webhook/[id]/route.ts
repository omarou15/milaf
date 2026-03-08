import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// POST /api/automations/webhook/[id]
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await req.text();

  // Return a lightweight response — actual execution happens client-side
  // because we use localStorage. For a real backend this would exec server-side.
  // We return the payload so the client polling can pick it up.
  return NextResponse.json({
    received: true,
    automationId: id,
    timestamp: new Date().toISOString(),
    payload: (() => {
      try { return JSON.parse(body); } catch { return {}; }
    })(),
  });
}

// GET — webhook test / health
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    ok: true,
    automationId: params.id,
    message: "Webhook Mi-Laf actif. Envoyez un POST avec vos données.",
  });
}
