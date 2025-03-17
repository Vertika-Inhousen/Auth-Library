import bcrypt from "bcryptjs";
import forge from 'node-forge';
import fs from "fs";

// Load RSA Private Key
const privateKeyPem = fs.readFileSync("private.pem", "utf8");

export const hashPassword = async (password, saltRounds) => {
  let hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};
export const decryptPassword = (encryptedPassword) => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  return privateKey.decrypt(forge.util.decode64(encryptedPassword), "RSA-OAEP");
};
export const encryptPassword = (password, publicKeyPem) => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  return forge.util.encode64(publicKey.encrypt(password, "RSA-OAEP"));
};