import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "40ff2d640ee46512") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });

  try {
    const sql = neon(dbUrl);

    // Enums — safe creation via DO block
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
        CREATE TYPE plan_type AS ENUM ('free','starter','pro','business');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tier_type') THEN
        CREATE TYPE tier_type AS ENUM ('tier1_word','tier2_pdf_form','tier3_pixel');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_status') THEN
        CREATE TYPE doc_status AS ENUM ('pending','generating','done','failed');
      END IF;
    END $$`;

    await sql`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      plan plan_type DEFAULT 'free' NOT NULL,
      credits_used INT DEFAULT 0 NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`;

    await sql`CREATE TABLE IF NOT EXISTS templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      tier tier_type DEFAULT 'tier1_word' NOT NULL,
      schema JSONB NOT NULL,
      storage_key TEXT,
      field_count INT DEFAULT 0 NOT NULL,
      is_public BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`;

    await sql`CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
      filename TEXT NOT NULL,
      status doc_status DEFAULT 'done' NOT NULL,
      credits_used INT DEFAULT 1 NOT NULL,
      storage_key TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`;

    await sql`CREATE TABLE IF NOT EXISTS activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`;

    await sql`CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id)`;

    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;

    return NextResponse.json({ success: true, tables: tables.map(t => t.table_name) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
