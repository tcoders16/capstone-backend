// src/server.ts
/**
 * Lost & Found API (Fastify + TypeScript)
 * Boots the HTTP server, wires middleware, and mounts route modules.
 */

import Fastify, { FastifyInstance, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import { config as loadEnv } from "dotenv";
loadEnv(); // ensure process.env is populated before importing env consumers

import { env } from "./api/env";
import { itemsRoutes } from "./routes/lostItem/item";



/** Pretty logger in dev, lean JSON logger in prod */
const isProd = process.env.NODE_ENV === "production";
function getLoggerConfig() {
  if (isProd) return { level: "info" as const };
  try {
    // only use pino-pretty if installed
    require.resolve("pino-pretty");
    return {
      level: "debug" as const,
      transport: {
        target: "pino-pretty",
        options: { translateTime: "SYS:standard", colorize: true },
      },
    };
  } catch {
    return { level: "debug" as const };
  }
}

/** Handy TODO responder */
function notImplemented(reply: FastifyReply, hint: string) {
  return reply.code(501).send({ error: "NOT_IMPLEMENTED", message: `TODO: ${hint}` });
}

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: getLoggerConfig(),
    // safe-ish defaults; tweak if you expect very large payloads
    bodyLimit: 10 * 1024 * 1024, // 10MB
    trustProxy: true,
  });


  // ── CORS ──────────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: isProd ? "*": true,
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // ── Health & metadata ────────────────────────────────────────────────────────
  app.get("/healthz", async () => ({ ok: true }));
  app.get("/readyz", async () => ({ ready: true }));
  app.get("/", async () => ({
    ok: true,
    service: "lostfound-api",
    version: process.env.npm_package_version ?? "0.0.0",
    env: process.env.NODE_ENV ?? "development",
  }));

  // ── Feature modules (register ONCE) ───────────────────────────────────────────
  // All item routes live under /api/items (upload/start, upload/finalize, analyse, etc.)
  app.register(itemsRoutes, { prefix: "/api/items" });

  // ── 404 & Error handling ─────────────────────────────────────────────────────
  app.setNotFoundHandler((req, reply) =>
    reply.code(404).send({ error: "NOT_FOUND", path: req.url })
  );

  app.setErrorHandler((err, _req, reply) => {
    app.log.error(err);
    const status = (err as any).statusCode ?? 500;
    reply.code(status).send({
      error: status === 500 ? "INTERNAL" : "BAD_REQUEST",
      message: isProd ? "Something went wrong" : (err as Error).message,
    });
  });

  return app;
}

// ── Boot when executed directly ────────────────────────────────────────────────
if (require.main === module) {
  buildServer()
    .then((app) =>
      app
        .listen({ host: "0.0.0.0", port: Number(env.PORT || 4000) })
        .then(() => app.log.info(`API listening on :${env.PORT || 4000}`))
    )
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });

  // graceful shutdown
  const stop = async (signal: NodeJS.Signals) => {
    console.log(`\n${signal} received, shutting down...`);
    try {
      // If you want, await app.close() here; we don't have app in this scope.
      process.exit(0);
    } catch (e) {
      console.error("Shutdown error", e);
      process.exit(1);
    }
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

// Export a convenient 501 helper for stubbing endpoints elsewhere
export { notImplemented };