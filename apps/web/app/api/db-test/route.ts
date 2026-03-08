import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "40ff2d640ee46512") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = "postgresql://neondb_owner:npg_cqVA62rkdQIb@ep-floral-rain-a13nitjq-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  try {
    const sql = neon(url);
    const result = await sql`SELECT current_database(), current_schema()`;
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
    return NextResponse.json({ connected: true, db: result[0], tables: tables.map(t => t.table_name) });
  } catch (err) {
    return NextResponse.json({ connected: false, error: err instanceof Error ? err.message : String(err) });
  }
}
