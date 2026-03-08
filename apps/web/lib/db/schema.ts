import { pgTable, text, timestamp, integer, pgEnum, uuid, jsonb, real, boolean } from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const planEnum = pgEnum("plan", ["free", "starter", "pro", "business"]);
export const tierEnum = pgEnum("tier", ["tier1_word", "tier2_pdf_form", "tier3_pixel", "tier4_clone"]);
export const statusEnum = pgEnum("status", ["active", "inactive", "processing", "error"]);
export const triggerEnum = pgEnum("trigger_type", ["cron", "webhook", "api"]);
export const dossierStatusEnum = pgEnum("dossier_status", ["brouillon", "en_cours", "envoye", "valide", "rejete", "archive"]);

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").notNull(),
  plan: planEnum("plan").default("free").notNull(),
  creditsTotal: integer("credits_total").default(10).notNull(),
  creditsUsed: integer("credits_used").default(0).notNull(),
  onboardingComplete: boolean("onboarding_complete").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Templates ─────────────────────────────────────────────────────────────────
export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // clerk_id
  name: text("name").notNull(),
  tier: tierEnum("tier").default("tier1_word").notNull(),
  moduleId: text("module_id"), // from marketplace
  schemaJson: jsonb("schema_json").notNull(),
  templateB64: text("template_b64"), // base64 of original file (optional, can be large)
  rendererCode: text("renderer_code"), // tier4 only
  emoji: text("emoji").default("📄"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Documents (generated) ─────────────────────────────────────────────────────
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  templateId: uuid("template_id"),
  name: text("name").notNull(),
  filename: text("filename"),
  tier: tierEnum("tier"),
  source: text("source").default("manual"), // manual, chat-instant, automation
  inputDataJson: jsonb("input_data_json"),
  dossierId: uuid("dossier_id"), // link to CRM dossier
  creditsUsed: integer("credits_used").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Dossiers (Mini CRM) ──────────────────────────────────────────────────────
export const dossiers = pgTable("dossiers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  clientNom: text("client_nom"),
  clientEmail: text("client_email"),
  clientTel: text("client_tel"),
  clientAdresse: text("client_adresse"),
  status: dossierStatusEnum("status").default("brouillon").notNull(),
  category: text("category"), // CEE, Immobilier, RH, etc.
  reference: text("reference"), // custom reference number
  notes: text("notes"),
  metadata: jsonb("metadata"), // flexible extra data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Automations ───────────────────────────────────────────────────────────────
export const automations = pgTable("automations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  templateId: uuid("template_id").notNull(),
  name: text("name").notNull(),
  triggerType: triggerEnum("trigger_type").notNull(),
  triggerConfig: jsonb("trigger_config"),
  fieldMapping: jsonb("field_mapping"), // maps trigger data to template fields
  status: statusEnum("status").default("active").notNull(),
  lastRun: timestamp("last_run"),
  runCount: integer("run_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Activity Logs ─────────────────────────────────────────────────────────────
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(), // template_created, document_generated, module_installed, etc.
  details: jsonb("details"),
  creditsUsed: integer("credits_used").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
