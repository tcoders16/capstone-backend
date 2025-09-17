// src/routes/controllers/lostItem/items.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import * as ItemsService from "../../services/items.service";
import { analyzeImage } from "../../services/lostItem/openai/analyseImage";
import type { Item, ItemId, ItemAttributes } from "../../types/items";

/* ========== Request DTOs (narrow the input surface) ========== */

type UploadStartBody = { contentType: string };

type UploadFinalizeBody = {
  itemId: ItemId;
  storagePath: string;
  locationName: string;
  description?: string;
  foundAt?: string; // ISO
};

type AnalyseWebhookBody = {
  itemId: ItemId;
  attributes: ItemAttributes | Record<string, string>; // tolerate early shape
  vectors?: number[];
};

type AnalyseFromUploadBody = {
  itemId: ItemId;
  imageUrl?: string;
  imageBase64?: string; // base64 without "data:" prefix
  detail?: "low" | "high" | "auto";
  prompt?: string;
};

/* ========== Controllers ========== */

/** POST /upload:start  -> signed URL (dev: fake) + provisional itemId */
export async function uploadStart(
  req: FastifyRequest<{ Body: UploadStartBody }>,
  reply: FastifyReply
) {
  const { contentType } = req.body || {};
  if (!contentType) return reply.code(400).send({ error: "Missing contentType" });

  const result = await ItemsService.createSignedUpload(contentType);
  return reply.send(result);
}

/** POST /upload:finalize -> persist initial Item record (status: "found") */
export async function uploadFinalize(
  req: FastifyRequest<{ Body: UploadFinalizeBody }>,
  reply: FastifyReply
) {
  const body = req.body;
  if (!body?.itemId || !body.storagePath || !body.locationName) {
    return reply.code(400).send({ error: "itemId, storagePath and locationName are required" });
  }

  const result = await ItemsService.finalizeUpload(body);
  return reply.send(result);
}

/** GET /:id -> fetch one item */
export async function getItem(
  req: FastifyRequest<{ Params: { id: ItemId } }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  const item = (await ItemsService.fetchItem(id)) as Item | null;
  if (!item) return reply.code(404).send({ error: "Item not found" });
  return reply.send(item);
}

/** GET / -> list items (later: add filters, pagination) */
export async function listItems(_req: FastifyRequest, reply: FastifyReply) {
  const items = (await ItemsService.listItems()) as Item[];
  return reply.send({ items });
}

/**
 * POST /analyse/webhook
 * Called by your background worker once AI analysis (vision/OCR/embeddings) completes.
 * Accepts normalized ItemAttributes and optional vectors to persist on the Item.
 */
export async function analyseWebhook(
  req: FastifyRequest<{ Body: AnalyseWebhookBody }>,
  reply: FastifyReply
) {
  const body = req.body;
  if (!body?.itemId || !body.attributes) {
    return reply.code(400).send({ error: "itemId and attributes are required" });
  }

  await ItemsService.updateExtracted({
    itemId: body.itemId,
    attributes: body.attributes as ItemAttributes,
    vectors: body.vectors,
  });

  return reply.send({ ok: true });
}

/**
 * POST /analyse
 * Developer shortcut: directly analyse an image payload (URL or base64) and
 * persist a simple free-form description on the Item.
 *
 * This is *not* your final webhook flow; it’s useful during integration
 * before you stand up a background worker.
 */
export async function analyseFromUpload(
  req: FastifyRequest<{ Body: AnalyseFromUploadBody }>,
  reply: FastifyReply
) {
  const body = req.body;
  if (!body?.itemId) return reply.code(400).send({ error: "itemId required" });
  if (!body.imageUrl && !body.imageBase64) {
    return reply.code(400).send({ error: "Provide imageUrl or imageBase64" });
  }

  // Calls OpenAI (via Responses API) and persists a natural-language description.
  const result = await analyzeImage(body);
  return reply.send(result);
}