import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";

export const runtime = "edge";

const app = new Hono().basePath("/api");
app.use("*", cors({ origin: "*", credentials: true }));

app.get("/health", (c) => c.json({ status: "ok", service: "Mi-Laf API", version: "1.0.0" }));

app.get("/templates", (c) => c.json({ templates: [], total: 0 }));
app.post("/templates", async (c) => {
  const body = await c.req.json();
  return c.json({ id: crypto.randomUUID(), ...body, created_at: new Date().toISOString() }, 201);
});

app.post("/generate/word", async (c) => {
  return c.json({ status: "queued", job_id: crypto.randomUUID() }, 202);
});

app.post("/generate/pdf-form", async (c) => {
  return c.json({ status: "queued", job_id: crypto.randomUUID() }, 202);
});

app.get("/modules", (c) => c.json({
  modules: [
    { slug: "cee-france", name: "CEE France", country: "FR", tier: "tier2", free: true },
    { slug: "maprimereno v", name: "MaPrimeRénov", country: "FR", tier: "tier2", free: true },
  ]
}));

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
