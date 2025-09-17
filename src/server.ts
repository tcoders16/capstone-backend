// src/server.ts
/**
 * Lost & Found API (Fastify + TypeScript)
 * Boots the HTTP server, wires middleware, mounts route modules.
 */
import Fastify, { FastifyInstance, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import { env } from "./api/env";
import { itemsRoutes } from "./routes/lostItem/item";

const isProd = process.env.NODE_ENV === "production";

function getLoggerConfig() {
  if (isProd) return { level: "info" as const };
  try {
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

// (handy for future TODO placeholders)
function notImplemented(reply: FastifyReply, hint: string) {
  return reply.code(501).send({ error: "NOT_IMPLEMENTED", message: `TODO: ${hint}` });
}

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: getLoggerConfig() });

  // CORS
  await app.register(cors, { origin: true, credentials: false });

  // Health/meta
  app.get("/healthz", async () => ({ ok: true }));
  app.get("/", async () => ({
    ok: true,
    service: "lostfound-api",
    version: process.env.npm_package_version ?? "0.0.0",
    env: process.env.NODE_ENV ?? "development",
  }));

  // Feature modules (register ONCE)
  app.register(itemsRoutes, { prefix: "/api/items" });

  // 404 + errors
  app.setNotFoundHandler((req, reply) => reply.code(404).send({ error: "NOT_FOUND", path: req.url }));
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

if (require.main === module) {
  buildServer()
    .then((app) =>
      app
        .listen({ host: "0.0.0.0", port: Number(env.PORT) })
        .then(() => app.log.info(`API listening on :${env.PORT}`))
    )
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });

  const stop = async (signal: NodeJS.Signals) => {
    console.log(`\n${signal} received, shutting down...`);
    try {
      process.exit(0);
    } catch (e) {
      console.error("Shutdown error", e);
      process.exit(1);
    }
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}