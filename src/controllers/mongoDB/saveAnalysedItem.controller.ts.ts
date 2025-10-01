// src/controllers/mongoDB/saveAnalysedItem.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { saveAnalysedItemService } from "../../services/saveToDatabase/mongoDB/saveAnalysedItem.service";


export async function saveAnalysedItemController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { itemId, location, desc = "", attributes = {}, image } = (req.body as any) ?? {};
    if (!itemId || !location) {
      return reply.code(400).send({ error: "itemId and location are required" });
    }
    const doc = await saveAnalysedItemService({ itemId, location, desc, attributes, image });
    return reply.code(200).send({ ok: true, item: doc });
  } catch (err) {
    req.log.error({ err }, "save item failed");
    return reply.code(500).send({ error: "Failed to save item" });
  }
}