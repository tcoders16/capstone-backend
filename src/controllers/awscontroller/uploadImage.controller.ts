import { FastifyRequest, FastifyReply } from "fastify";
import { uploadImage } from "../../services/saveToDatabase/aws/uploadImage";

type UploadBody = { fileId?: string };

export async function uploadImageController(req: FastifyRequest, reply: FastifyReply) {
  try {
    // 1) read file from multipart
    const file = await (req as any).file();
    if (!file) return reply.code(400).send({ error: "file field is required (multipart/form-data)" });

    // 2) metadata from file
    const originalName = file.filename;
    const mime = file.mimetype;

    // 3) required field: fileId (or auto-generate)
    const { fileId: raw } = (req.body ?? {}) as UploadBody;
    const fileId = (raw ?? "").trim() || `tmp-${Date.now()}`;   // avoid "undefined" folder

    // 4) file bytes
    const imageBuffer = await file.toBuffer();

    // 5) service
    const result = await uploadImage(fileId, imageBuffer, mime, originalName);

    return reply.code(200).send(result);
  } catch (err) {
    req.log.error({ err }, "Upload failed");
    return reply.code(500).send({ error: "Failed to upload image" });
  }
}