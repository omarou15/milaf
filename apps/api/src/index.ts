import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { Server as SocketServer } from "socket.io";

import { pdfAnalyzeRouter } from "./routes/pdf-analyze";
import { pdfGenerateRouter } from "./routes/pdf-generate";
import { claudeRouter } from "./routes/claude";
import { healthRouter } from "./routes/health";

const app = new Hono();

app.use("*", cors({ origin: "*", credentials: true }));
app.use("*", logger());

// Routes
app.route("/health", healthRouter);
app.route("/pdf/analyze", pdfAnalyzeRouter);
app.route("/pdf/generate", pdfGenerateRouter);
app.route("/claude", claudeRouter);

// Root
app.get("/", (c) => c.json({ service: "milaf-api", status: "ok", version: "1.0.0" }));

const PORT = parseInt(process.env.PORT || "4000");

// Use @hono/node-server's serve() which returns the http.Server
const server = serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`🚀 Mi-Laf Engine API → http://localhost:${info.port}`);
});

// Attach Socket.io to the underlying http server
const io = new SocketServer(server, {
  cors: { origin: "*" },
  path: "/ws",
});

io.on("connection", (socket) => {
  console.log(`[WS] Client connecté: ${socket.id}`);

  socket.on("analyze-pdf", async (data) => {
    socket.emit("status", { step: "receiving", message: "PDF reçu, analyse en cours..." });
    socket.emit("status", { step: "done" });
  });

  socket.on("disconnect", () => {
    console.log(`[WS] Client déconnecté: ${socket.id}`);
  });
});
