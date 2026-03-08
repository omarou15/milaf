import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createServer } from "http";
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

// HTTP server (pour WebSocket)
const httpServer = createServer();

// Socket.io pour streaming résultats
const io = new SocketServer(httpServer, {
  cors: { origin: "*" },
  path: "/ws",
});

io.on("connection", (socket) => {
  console.log(`[WS] Client connecté: ${socket.id}`);

  socket.on("analyze-pdf", async (data) => {
    socket.emit("status", { step: "receiving", message: "PDF reçu, analyse en cours..." });
    // Relayé vers le service Python
    socket.emit("status", { step: "done" });
  });

  socket.on("disconnect", () => {
    console.log(`[WS] Client déconnecté: ${socket.id}`);
  });
});

// Attacher Hono au serveur HTTP
httpServer.on("request", (req, res) => {
  // @ts-ignore
  app.fetch(req, res);
});

const PORT = parseInt(process.env.PORT || "4000");
httpServer.listen(PORT, () => {
  console.log(`🚀 Mi-Laf Engine API → http://localhost:${PORT}`);
});
