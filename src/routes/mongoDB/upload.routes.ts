// src/routes/upload.routes.ts
import { FastifyInstance } from "fastify";
import { saveAnalysedItemController } from "../../controllers/mongoDB/saveAnalysedItem.controller.ts";


export async function registerUploadRoutes(app: FastifyInstance) {
  // Final path: POST /api/upload/item
  app.post("/api/upload/mongodb/item", saveAnalysedItemController);
}