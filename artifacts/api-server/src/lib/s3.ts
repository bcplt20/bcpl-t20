import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.AWS_S3_BUCKET  || "bcpl-trial-videos";
const REGION = process.env.AWS_REGION     || "ap-south-1";

let _s3: S3Client | null = null;

function getS3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: REGION,
      ...(process.env.AWS_ACCESS_KEY_ID
        ? {
            credentials: {
              accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
          }
        : {}),
    });
  }
  return _s3;
}

/** Returns a pre-signed PUT URL valid for 1 hour — frontend uploads directly to S3 */
export async function getUploadPresignedUrl(key: string, contentType: string): Promise<string> {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.warn("[S3-STUB] presigned URL for", key);
    return `https://mock-s3.bcplt20.com/${key}?presigned=true`;
  }
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(getS3(), cmd, { expiresIn: 3600 });
}

export function getS3Url(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export async function deleteObject(key: string): Promise<void> {
  if (!process.env.AWS_ACCESS_KEY_ID) return;
  await getS3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
