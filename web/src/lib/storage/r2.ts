// Cloudflare R2 pela API compatível com S3. Bucket PRIVADO: tudo por URL assinada.
// CORS do bucket precisa liberar PUT/GET a partir de APP_URL (ver replica/backend.md).
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Storage } from "./index";

const g = globalThis as { __r2?: Storage };

export function r2Storage(): Storage {
  if (g.__r2) return g.__r2;
  const bucket = process.env.R2_BUCKET!;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
  });
  g.__r2 = {
    uploadUrl: (key, contentType) =>
      getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 15 * 60 }),
    viewUrl: (key) => getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 60 * 60 }),
    async delete(keys) {
      for (let i = 0; i < keys.length; i += 1000) {
        await client.send(new DeleteObjectsCommand({
          Bucket: bucket, Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
        }));
      }
    },
  };
  return g.__r2;
}
