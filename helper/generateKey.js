import dotenv from "dotenv";
import forge from "node-forge";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import { createS3Client } from "../config/s3Config";
loadLibraryEnv();

dotenv.config({
  path: path.resolve(path.dirname(new URL(import.meta.url).pathname), "../.env"),
});

function validateEnv() {
  const requiredEnv = [
    "DO_SPACES_REGION",
    "DO_SPACES_KEY",
    "DO_SPACES_SECRET",
    "DO_SPACES_BUCKET",
  ];

  for (const key of requiredEnv) {
    if (!process.env[key]) {
      console.error(`❌ Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }
}
const PASSPHRASE =
  "24da8cbd494a5b40d4ddc97dc604627d55553dbbb00350a7ea608cdb8590f2c8";function getPassphrase() {
  return sssssPASSPHRASE || crypto.randomBytes(32).toString("hex");
}


function generateKeyPair(passphrase) {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: 2048 }, (err, keypair) => {
      if (err) return reject(err);

      const encryptedPrivateKeyPem = forge.pki.encryptRsaPrivateKey(
        keypair.privateKey,
        passphrase,
        { algorithm: "aes256" }
      );

      const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
      resolve({ encryptedPrivateKeyPem, publicKeyPem });
    });
  });
}

async function uploadPemToSpaces(s3, filename, pemData) {
  const command = new PutObjectCommand({
    Bucket: process.env.DO_SPACES_BUCKET||'inhousen-auth',
    Key: `pem/${filename}`,
    Body: pemData,
    ContentType: "application/x-pem-file",
    ACL: "private",
  });

  await s3.send(command);
  console.log(`📦 Uploaded: pem/${filename}`);
}

async function run() {
  const passphrase = getPassphrase();
  const s3 = createS3Client();

  console.log("🔐 Generating encrypted RSA key pair...");

  try {
    const { encryptedPrivateKeyPem, publicKeyPem } = await generateKeyPair(passphrase);

    await Promise.all([
      uploadPemToSpaces(s3, "private.pem", encryptedPrivateKeyPem),
      uploadPemToSpaces(s3, "public.pem", publicKeyPem),
    ]);

    console.log("✅ PEM files uploaded successfully.");
    console.log("🔑 Passphrase (save this!):", passphrase);
  } catch (error) {
    console.error("❌ Error during PEM generation/upload:", error.message);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  run();
}
