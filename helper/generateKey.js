import forge from "node-forge";
import fs from "fs";

const keys = forge.pki.rsa.generateKeyPair(2048);
const publicKeyPem = forge.pki.publicKeyToPem(keys.publicKey);
const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);

// Save to files
fs.writeFileSync("public.pem", publicKeyPem);
fs.writeFileSync("private.pem", privateKeyPem);

console.log("Public and Private keys generated successfully.");
console.log("Public Key:\n", publicKeyPem);
console.log("Private Key:\n", privateKeyPem);
