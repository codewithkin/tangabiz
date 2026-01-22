import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

// Import routes
import { authRoutes } from "./routes/auth";
import { businessRoutes } from "./routes/business";
import { productRoutes } from "./routes/products";
import { customerRoutes } from "./routes/customers";
import { transactionRoutes } from "./routes/transactions";
import { reportRoutes } from "./routes/reports";
import { uploadRoutes } from "./routes/upload";
import { notificationRoutes } from "./routes/notifications";
import { aiRoutes } from "./routes/ai";

// Import WebSocket manager
import {
  registerConnection,
  removeConnection,
  getTotalConnectionCount,
  type WebSocketData,
} from "./lib/websocket";

// Create Hono app
const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:8081"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Health check
app.get("/", (c) => {
  return c.json({
    name: "Tangabiz API",
    version: "0.0.1",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Mount routes
app.route("/api/auth", authRoutes);
app.route("/api/businesses", businessRoutes);
app.route("/api/products", productRoutes);
app.route("/api/customers", customerRoutes);
app.route("/api/transactions", transactionRoutes);
app.route("/api/reports", reportRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/notifications", notificationRoutes);
app.route("/api/ai", aiRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found", message: "The requested resource was not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);
  return c.json(
    {
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    },
    500
  );
});

// Start server
const port = process.env.PORT || 3002;

console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🌿 TANGABIZ API SERVER                                 ║
║   All-in-one Business Management Platform                ║
║                                                          ║
║   Server running at http://localhost:${port}               ║
║   WebSocket available at ws://localhost:${port}/ws         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

export default {
  port,
  fetch: app.fetch,
  websocket: {
    open(ws: any) {
      registerConnection(ws);
      ws.send(JSON.stringify({ type: "connected", timestamp: new Date().toISOString() }));
    },
    message(ws: any, message: string) {
      try {
        const data = JSON.parse(message);
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
        }
      } catch (error) {
        console.error("[WS] Failed to parse message:", error);
      }
    },
    close(ws: any) {
      removeConnection(ws);
    },
    error(ws: any, error: Error) {
      console.error("[WS] Error:", error);
    },
  },
};
