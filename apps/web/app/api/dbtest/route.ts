import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ENCRYPTION_KEY?.slice(0, 16)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = process.env.DATABASE_URL || "NOT SET";
  const masked = url.replace(/:([^@]+)@/, ":***@");
  try {
    const sql = neon(url);
    const result = await sql`SELECT version()`;
    return NextResponse.json({ ok: true, masked_url: masked, pg: result[0].version.split(" ").slice(0,2).join(" ") });
  } catch (err) {
    return NextResponse.json({ ok: false, masked_url: masked, error: err instanceof Error ? err.message : String(err) });
  }
}
