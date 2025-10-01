import { FastifyInstance } from "fastify";
import { uploadImageController } from "../../controllers/awscontroller/uploadImage.controller";


export async function uploadImageRoutes(app: FastifyInstance) {
  // Final URL = /api/upload/s3/upload-image
  app.post("/s3/upload-image", uploadImageController);
}