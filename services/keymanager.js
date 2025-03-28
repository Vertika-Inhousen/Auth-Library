// services/keyService.js
import { GetObjectCommand } from "@aws-sdk/client-s3";
import forge from "node-forge";
import streamToString from "../helper/streamToString.js";
import { createS3Client } from "../config/s3Config.js";

function validateEnv() {
  const requiredEnv = [
    "DO_SPACES_REGION",
    "DO_SPACES_KEY",
    "DO_SPACES_SECRET",
    "DO_SPACES_BUCKET",
    "PASSPHRASE",
  ];
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required env: ${key}`);
    }
  }
}

const PASSPHRASE =
  "24da8cbd494a5b40d4ddc97dc604627d55553dbbb00350a7ea608cdb8590f2c8";

export async function getPrivateKey() {
  const s3 = createS3Client();

  const command = new GetObjectCommand({
    Bucket: process.env.DO_SPACES_BUCKET || "inhousen-auth",
    Key: "pem/private.pem",
  });

  const response = await s3.send(command);
  const encryptedPem = await streamToString(response.Body);

  const privateKey = forge.pki.decryptRsaPrivateKey(encryptedPem, PASSPHRASE);

  if (!privateKey) {
    throw new Error("Failed to decrypt private key. Check your passphrase.");
  }

  return forge.pki.privateKeyToPem(privateKey);
}

export async function getPublicKey() {
  const s3 = createS3Client();

  const command = new GetObjectCommand({
    Bucket: process.env.DO_SPACES_BUCKET|| "inhousen-auth",
    Key: "pem/public.pem",
  });

  const response = await s3.send(command);
  return streamToString(response.Body);
}
