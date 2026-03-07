import { pgTable, text, timestamp, integer, pgEnum, uuid, jsonb, real } from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["starter", "pro", "business", "enterprise"]);
export const tierEnum = pgEnum("tier", ["tier1_word", "tier2_pdf_form", "tier3_pixel"]);
export const statusEnum = pgEnum("status", ["active", "inactive", "processing", "error"]);
export const triggerEnum = pgEnum("trigger_type", ["cron", "webhook", "email", "file_upload", "api"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").notNull(),
  plan: planEnum("plan").default("starter").notNull(),
  country: text("country").default("FR"),
  apiKeyEncrypted: text("api_key_encrypted"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").notNull(),
  plan: planEnum("plan").default("starter").notNull(),
  country: text("country").default("FR"),
  creditsBalance: integer("credits_balance").default(100).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  tier: tierEnum("tier").default("tier1_word").notNull(),
  category: text("category"),
  version: integer("version").default(1).notNull(),
  schemaJson: jsonb("schema_json"),
  sourceFileUrl: text("source_file_url"),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull(),
  templateId: uuid("template_id").notNull(),
  status: statusEnum("status").default("processing").notNull(),
  inputDataJson: jsonb("input_data_json"),
  outputFileUrl: text("output_file_url"),
  creditsUsed: integer("credits_used").default(0),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const automations = pgTable("automations", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull(),
  templateId: uuid("template_id").notNull(),
  name: text("name").notNull(),
  triggerType: triggerEnum("trigger_type").notNull(),
  triggerConfig: jsonb("trigger_config"),
  status: statusEnum("status").default("active").notNull(),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  runCount: integer("run_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modules = pgTable("modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  country: text("country"),
  tier: tierEnum("tier").notNull(),
  price: real("price").default(0),
  version: integer("version").default(1).notNull(),
  downloads: integer("downloads").default(0),
  rating: real("rating").default(0),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull(),
  userId: uuid("user_id"),
  action: text("action").notNull(),
  details: jsonb("details"),
  creditsUsed: integer("credits_used").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
