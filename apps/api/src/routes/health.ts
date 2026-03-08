import { Hono } from "hono";

export const healthRouter = new Hono();

healthRouter.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "milaf-engine",
    version: "1.0.0",
    capabilities: ["pdf-analyze", "pdf-generate", "claude-proxy"],
    timestamp: new Date().toISOString(),
  });
});
