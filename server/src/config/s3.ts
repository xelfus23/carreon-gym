import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.ts";

export const s3 = new S3Client({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  },
});
