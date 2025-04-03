// services/keyService.js
import { GetObjectCommand } from "@aws-sdk/client-s3";
import forge from "node-forge";
import streamToString from "../helper/streamToString.js";

const PASSPHRASE =
  "24da8cbd494a5b40d4ddc97dc604627d55553dbbb00350a7ea608cdb8590f2c8";

export async function getPrivateKey(s3) {
  const command = new GetObjectCommand({
    Bucket:  s3?.config?.bucket,
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

export async function getPublicKey(s3) {
  const command = new GetObjectCommand({
    Bucket: s3?.config?.bucket,
    Key: "pem/public.pem",
  });
  const response = await s3.send(command);
  const result = await streamToString(response.Body);
  return result
}
