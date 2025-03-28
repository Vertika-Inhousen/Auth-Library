import bcrypt from "bcryptjs";
import forge from "node-forge";
import { getPrivateKey, getPublicKey } from "./services/keymanager.js";
// import fs from "fs";

// Load RSA Private Key

export const hashPassword = async (password, saltRounds) => {
  let hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};
export const decryptPassword = async (encryptedPassword) => {
  const privateKeyPem = await getPrivateKey();
  if (privateKeyPem) {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const decoded = forge.util.decode64(encryptedPassword);
    const decrypted = privateKey.decrypt(decoded, "RSA-OAEP", {
      md: forge.md.sha256.create(),
    });
    return decrypted;
  }
};

export const encryptPassword = async (password) => {
  const publicKeyPem = await getPublicKey();

  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encryptedBytes = publicKey.encrypt(password, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });
  return forge.util.encode64(encryptedBytes);
};

