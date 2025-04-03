import bcrypt from "bcryptjs";
import forge from "node-forge";
import { getPrivateKey } from "./services/keymanager.js";
import memjs from "memjs";
import jwt from "jsonwebtoken";

export const hashPassword = async (password, saltRounds) => {
  let hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};
export const decryptPassword = async (encryptedPassword, s3Data) => {
  const privateKeyPem = await getPrivateKey(s3Data);
  if (privateKeyPem) {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const decoded = forge.util.decode64(encryptedPassword);
    const decrypted = privateKey.decrypt(decoded, "RSA-OAEP", {
      md: forge.md.sha256.create(),
    });
    return decrypted;
  }
};

export const encryptPassword = async (password, key) => {
  const publicKey = forge.pki.publicKeyFromPem(key);
  const encryptedBytes = publicKey.encrypt(password, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });
  return forge.util.encode64(encryptedBytes);
};
export const verifyToken = async (token, config) => {
  const memcached = memjs.Client.create(
    process.env.MEMCACHED_URL || "localhost:11211"
  );
  // Verify Token using JWT
  try {
    // Check Memcached for cached token
    const cachedUser = await memcached.get(token);

    if (cachedUser.value) {
      return {
        message: "Token is valid (cached)",
        user: JSON.parse(cachedUser.value.toString()),
        status:200
      };
    }
    // Get Secret
    const secret = await config.getJwtSecret();
    // Verify token
    const decoded = jwt.verify(token, secret);

    // Cache token (expires in 1 hour)
    await memcached.set(token, JSON.stringify(decoded), { expires: 3600 });

    return { message: "Token is valid", user: decoded, status: 200 };
  } catch (error) {
    return {message: error,status:400};
  }
};
