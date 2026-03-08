const { neon } = require("@neondatabase/serverless");
// Sans channel_binding qui cause des problèmes avec neon serverless
const DATABASE_URL = "postgresql://neondb_owner:npg_cqVA62rkdQIb@ep-floral-rain-a13nitjq-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const sql = neon(DATABASE_URL);
  
  const stmts = [
    `DO $$ BEGIN CREATE TYPE plan AS ENUM ('starter','pro','business','enterprise'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE tier AS ENUM ('tier1_word','tier2_pdf_form','tier3_pixel'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE status AS ENUM ('active','inactive','processing','error'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE trigger_type AS ENUM ('cron','webhook','email','file_upload','api'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), clerk_id TEXT UNIQUE NOT NULL, email TEXT NOT NULL, plan plan DEFAULT 'starter' NOT NULL, country TEXT DEFAULT 'FR', api_key_encrypted TEXT, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS organizations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, owner_id UUID NOT NULL, plan plan DEFAULT 'starter' NOT NULL, country TEXT DEFAULT 'FR', credits_balance INTEGER DEFAULT 100 NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS templates (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL, tier tier DEFAULT 'tier1_word' NOT NULL, category TEXT, version INTEGER DEFAULT 1 NOT NULL, schema_json JSONB, source_file_url TEXT, status status DEFAULT 'active' NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL, template_id UUID NOT NULL, status status DEFAULT 'processing' NOT NULL, input_data_json JSONB, output_file_url TEXT, credits_used INTEGER DEFAULT 0, generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS automations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL, template_id UUID NOT NULL, name TEXT NOT NULL, trigger_type trigger_type NOT NULL, trigger_config JSONB, status status DEFAULT 'active' NOT NULL, last_run TIMESTAMPTZ, next_run TIMESTAMPTZ, run_count INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS modules (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), author_id UUID NOT NULL, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT, country TEXT, tier tier NOT NULL, price REAL DEFAULT 0, version INTEGER DEFAULT 1 NOT NULL, downloads INTEGER DEFAULT 0, rating REAL DEFAULT 0, status status DEFAULT 'active' NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS activity_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL, user_id UUID, action TEXT NOT NULL, resource_type TEXT, resource_id UUID, details JSONB, credits_used INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
  ];
  
  for (const s of stmts) {
    await sql(s);
    const m = s.match(/(CREATE TABLE IF NOT EXISTS|CREATE TYPE)\s+(\w+)/);
    if (m) console.log("✅", m[2]);
  }
  
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log("\n🗄️  Tables:", tables.map(r => r.table_name).join(", "));
  console.log("✅ Schema prêt !");
}
main().catch(e => { console.error("❌", e.message); process.exit(1); });
