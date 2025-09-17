// src/routes/lostItem/item.ts
import { FastifyInstance } from "fastify";
import {
  uploadStart,
  uploadFinalize,
  getItem,
  listItems,
  analyseWebhook,
  analyseFromUpload,
} from "../../controllers/lostItem/items.controller";

export async function itemsRoutes(app: FastifyInstance) {
  // Final URLs = /api/items/...
  app.post("/upload/start", uploadStart);
  app.post("/upload/finalize", uploadFinalize);
  app.get("/:id", getItem);
  app.get("/", listItems);

  // Dev/in-house analysis flows
  app.post("/analyse", analyseFromUpload);     // manual analysis
  app.post("/analyse/webhook", analyseWebhook); // worker/webhook callback
}