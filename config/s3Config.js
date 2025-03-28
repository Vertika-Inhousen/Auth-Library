import { S3Client } from "@aws-sdk/client-s3";

export function createS3Client() {
  return new S3Client({
    region: process.env.DO_SPACES_REGION || "ams3",
    endpoint: `https://${process.env.DO_SPACES_REGION||'ams3'}.digitaloceanspaces.com`,
    credentials: {
      accessKeyId: process.env.DO_SPACES_KEY||'DO801R4Z4VE22PTN4ND7',
      secretAccessKey: process.env.DO_SPACES_SECRET||'w0+K7rH5kge1YwwngjNqFl1HJc8fxTxqLprwm5B+Ek4',
    },
  });
}