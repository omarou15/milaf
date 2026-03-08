import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, templates, documents, dossiers } from "@/lib/db/schema";
import { eq, desc, and, sql as rawSql } from "drizzle-orm";

export const runtime = "nodejs";

const app = new Hono().basePath("/api/v1");
app.use("*", cors({ origin: "*", credentials: true }));

async function getUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch { return null; }
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", async (c) => {
  try {
    await db.execute(rawSql`SELECT 1`);
    return c.json({ status: "ok", db: "connected" });
  } catch (e: any) {
    return c.json({ status: "error", db: e.message }, 500 as any);
  }
});

// ── Me ────────────────────────────────────────────────────────────────────────
app.get("/me", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  const rows = await db.select().from(users).where(eq(users.clerkId, uid)).limit(1);
  if (rows.length) return c.json(rows[0]);
  const created = await db.insert(users).values({
    clerkId: uid, email: "", plan: "free", creditsTotal: 10, creditsUsed: 0,
  }).returning();
  return c.json(created[0]);
});

// ── Templates ─────────────────────────────────────────────────────────────────
app.get("/templates", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  const rows = await db.select().from(templates).where(eq(templates.userId, uid)).orderBy(desc(templates.createdAt));
  return c.json({ templates: rows });
});

app.post("/templates", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  const b = await c.req.json();
  const created = await db.insert(templates).values({
    userId: uid, name: b.name || "Sans titre", tier: b.tier || "tier1_word",
    moduleId: b.moduleId, schemaJson: b.schemaJson, templateB64: b.templateB64 || null,
    rendererCode: b.rendererCode || null, emoji: b.emoji || "📄",
  }).returning();
  return c.json(created[0], 201 as any);
});

app.delete("/templates/:id", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  await db.delete(templates).where(and(eq(templates.id, c.req.param("id")), eq(templates.userId, uid)));
  return c.json({ ok: true });
});

// ── Documents ─────────────────────────────────────────────────────────────────
app.get("/documents", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  const rows = await db.select().from(documents).where(eq(documents.userId, uid)).orderBy(desc(documents.createdAt));
  return c.json({ documents: rows });
});

app.post("/documents", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  const b = await c.req.json();
  const created = await db.insert(documents).values({
    userId: uid, name: b.name || "Document", filename: b.filename,
    templateId: b.templateId || null, tier: b.tier || null, source: b.source || "manual",
    inputDataJson: b.inputDataJson || null, dossierId: b.dossierId || null, creditsUsed: b.creditsUsed || 1,
  }).returning();
  return c.json(created[0], 201 as any);
});

// ── Dossiers (Mini CRM) ──────────────────────────────────────────────────────
app.get("/dossiers", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  const rows = await db.select().from(dossiers).where(eq(dossiers.userId, uid)).orderBy(desc(dossiers.updatedAt));
  return c.json({ dossiers: rows });
});

app.post("/dossiers", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  const b = await c.req.json();
  const created = await db.insert(dossiers).values({
    userId: uid, name: b.name || "Nouveau dossier", clientNom: b.clientNom,
    clientEmail: b.clientEmail, clientTel: b.clientTel, clientAdresse: b.clientAdresse,
    status: b.status || "brouillon", category: b.category, reference: b.reference,
    notes: b.notes, metadata: b.metadata || null,
  }).returning();
  return c.json(created[0], 201 as any);
});

app.patch("/dossiers/:id", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  const b = await c.req.json();
  const upd: any = { updatedAt: new Date() };
  for (const k of ["name","status","clientNom","clientEmail","clientTel","clientAdresse","notes","reference","category"]) {
    if (b[k] !== undefined) upd[k] = b[k];
  }
  const rows = await db.update(dossiers).set(upd)
    .where(and(eq(dossiers.id, c.req.param("id")), eq(dossiers.userId, uid))).returning();
  if (!rows.length) return c.json({ error: "Non trouvé" }, 404 as any);
  return c.json(rows[0]);
});

app.delete("/dossiers/:id", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  await db.delete(dossiers).where(and(eq(dossiers.id, c.req.param("id")), eq(dossiers.userId, uid)));
  return c.json({ ok: true });
});

app.get("/dossiers/:id/documents", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  const rows = await db.select().from(documents)
    .where(and(eq(documents.userId, uid), eq(documents.dossierId, c.req.param("id"))))
    .orderBy(desc(documents.createdAt));
  return c.json({ documents: rows });
});

// ── Stats ─────────────────────────────────────────────────────────────────────
app.get("/stats", async (c) => {
  const uid = await getUserId();
  if (!uid) return c.json({ error: "Non authentifié" }, 401 as any);
  const [t] = await db.select({ count: rawSql<number>`count(*)` }).from(templates).where(eq(templates.userId, uid));
  const [d] = await db.select({ count: rawSql<number>`count(*)` }).from(documents).where(eq(documents.userId, uid));
  const [ds] = await db.select({ count: rawSql<number>`count(*)` }).from(dossiers).where(eq(dossiers.userId, uid));
  return c.json({ templates: Number(t?.count||0), documents: Number(d?.count||0), dossiers: Number(ds?.count||0) });
});

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
