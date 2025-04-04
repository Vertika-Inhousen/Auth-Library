import bcrypt from "bcryptjs";
import forge from "node-forge";
import { getPrivateKey } from "./services/keymanager.js";
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
  try {
    const memcached = await config.getMemCacheClient();
    const secret = await config.getJwtSecret();

    if (!token) {
      return { message: "No token provided", status: 400 };
    }

    // ✅Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      console.error("Invalid token:", err);
      return { err: err, statusCode: 400 };
    }
    if (memcached) {
      // ✅ Check if token is blacklisted
      const cachedValue = await new Promise((resolve, reject) => {
        memcached.get(token, (err, data) => {
          if (err) {
            console.error("Memcached error:", err);
            reject({ message: "Error checking token", status: 500 });
          } else {
            resolve(data ? data.toString().trim() : null); // ✅ Convert Buffer to String & Trim
          }
        });
      });
      if (cachedValue == "blacklisted") {
        return { message: "Token is blacklisted", status: 401 };
      } else {
        if (cachedValue?.id) {
          return {
            message: "Token is valid (cached)",
            user: cachedValue,
            status: 200,
          };
        }

        // ✅ Cache token (expires in 1 hour)
        await new Promise((resolve, reject) => {
          memcached.set(token, JSON.stringify(decoded), 3600, (err) => {
            if (err) {
              console.error("Memcached error:", err);
              return reject({ message: "Error caching token", status: 500 });
            }
            resolve();
          });
        });
        return { message: "Token is valid", user: decoded, status: 200 };
      }
    }
  } catch (error) {
    console.error("User Authentication failed", error);
    return { message: error?.message || "Invalid token", status: 400 };
  }
};

export const destroyToken = async (token, config) => {
  try {
    const memcached = await config.getMemCacheClient();
    const secret = await config.getJwtSecret();

    if (!token) {
      return { message: "No token provided", statusCode: 400 };
    }

    // ✅ Decode token to get expiration time
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      console.error("Invalid token:", err);
      return { error: err, statusCode: 400 };
    }

    const expTime = decoded.exp - Math.floor(Date.now() / 1000); // Remaining time

    if (expTime <= 0) {
      return { message: "Token already expired", statusCode: 400 };
    }

    // ✅ Blacklist token by storing it in Memcached
    return new Promise((resolve, reject) => {
      memcached.set(token, "blacklisted", expTime, (memErr) => {
        if (memErr) {
          console.error("Memcached error:", memErr);
          reject({ message: "Error destroying token", statusCode: 500 });
        }

        resolve({ message: "Token destroyed successfully", statusCode: 200 });
      });
    });
  } catch (error) {
    console.error("Error logging out:", error);
    return { message: "Error logging you out", err: error, statusCode: 500 };
  }
};
