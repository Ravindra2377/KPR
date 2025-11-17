import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";

type Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
};

const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.S3_BUCKET;
const PREFIX = process.env.S3_UPLOAD_PREFIX || "profile";

if (!BUCKET) {
  throw new Error("S3_BUCKET environment variable is required");
}

const credentials: Credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
};

export const s3 = new S3Client({
  region: REGION,
  credentials
});

export const getS3KeyFor = (keyParts: string[]) => path.posix.join(PREFIX, ...keyParts);

export async function createPresignedPutUrl(
  keyParts: string[],
  contentType: string,
  expiresIn = 900
) {
  const Key = getS3KeyFor(keyParts);
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key,
    ContentType: contentType,
    ACL: "private"
  });
  const url = await getSignedUrl(s3, command, { expiresIn });
  return { key: Key, url, bucket: BUCKET };
}

export const buildPublicUrl = (key: string) =>
  `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
