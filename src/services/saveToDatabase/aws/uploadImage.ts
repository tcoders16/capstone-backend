// src/services/saveToDatabase/aws/uploadImage.ts
import { uploadImageToS3, buildImageKey, getSignedUrlForKey } from "../../../client/s3";

export type UploadedImageInfo = {
  bucket: string;
  key: string;
  s3Uri: string;
  signedUrl: string;
};

export async function uploadImage(
  fileId: string,
  imageBuffer: Buffer,
  mime: string,
  originalName?: string
): Promise<UploadedImageInfo> {
  const key = buildImageKey(fileId, originalName ?? "image.jpg");

  // ⬇️ was: uploadImageToS3(key, imageBuffer, mime)
  const put = await uploadImageToS3({
    key,
    body: imageBuffer,
    contentType: mime,
  });

  const signedUrl = await getSignedUrlForKey(key, 3600);

  return {
    bucket: put.bucket,
    key,
    s3Uri: put.s3Uri,
    signedUrl,
  };
}