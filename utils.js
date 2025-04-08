import bcrypt from "bcryptjs";
import forge from "node-forge";
import { getPrivateKey } from "./services/keymanager.js";
import jwt from "jsonwebtoken";

// Hash Password
export const hashPassword = async (password, saltRounds) => {
  let hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};
// Decrypt password
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

// Encrypt password
export const encryptPassword = async (password, key) => {
  const publicKey = forge.pki.publicKeyFromPem(key);
  const encryptedBytes = publicKey.encrypt(password, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });
  return forge.util.encode64(encryptedBytes);
};

// Verify Token
export const verifyToken = async (token, config) => {
  try {
    const memcached = await config.getMemCacheClient();
    const secret = await config.getJwtSecret();
    const redis_host = await config.getRedisHost();
    const validation_api = await config.getValidationAPI();
    if (!token) {
      return { message: "No token provided", status: 400 };
    }
    let decoded;
    if (secret) {
      // ✅Verify token (JWT SECRET)
      try {
        decoded = jwt.verify(token, secret);
      } catch (err) {
        console.error("Invalid token:", err);
        return { err: err, statusCode: 400,data:[] };
      }
    } else if (validation_api) {
      // ✅Verify token (API)
      const isValid = await validateToken(token, validation_api);
      if (isValid?.status == 200) {
        decoded = isValid?.user;
      } else {
        return {
          message: isValid?.message || "Invalid token",
          status: isValid?.status,
        };
      }
    } else {
      return { message: "Unable to verify token", status: 400 };
    }
    // Format token with prefix AUTH_LIB
    let formatted_token = "AUTH_LIB_" + `${token}`;
    if (memcached) {
      // ✅ Check if token is blacklisted (Memcached)
      const cachedValue = await new Promise((resolve, reject) => {
        memcached.get(formatted_token, (err, data) => {
          if (err) {
            console.error("Memcached error:", err);
            reject({ message: "Error checking token", status: 500 });
          } else {
            resolve(data ? data.toString().trim() : null); // ✅ Convert Buffer to String & Trim
          }
        });
      });
      if (cachedValue == "blacklisted") {
        return { message: "Token expired or blacklisted", status: 401 };
      } else {
        if (cachedValue?.id) {
          return {
            message: "Token is valid (cached)",
            user: cachedValue,
            status: 200,
          };
        }

        // ✅ Cache token (expires in 10 hour)
        await new Promise((resolve, reject) => {
          memcached.set(
            formatted_token,
            JSON.stringify(decoded),
            36000,
            (err) => {
              if (err) {
                console.error("Memcached error:", err);
                return reject({ message: "Error caching token", status: 500 });
              }
              resolve();
            }
          );
        });
        return { message: "Token is valid", user: decoded, status: 200 };
      }
    }
    // ✅ Verify token (redis) create one if it doesn't exists
    if (redis_host) {
      const cachedValue = await redis_host.get(`${formatted_token}`);
      if (cachedValue == null) {
        // ✅ Cache token (expires in 10 hours)
        try {
          let result = await redis_host.set(
            formatted_token,
            decoded?.user || decoded?.email,
            "EX",
            36000
          );
          if (result == "OK") {
            return { message: "Token is valid", user: decoded, status: 200 };
          }
        } catch (error) {
          console.error("Redis error:", error);
          return { message: "Error verifying token", status: 500 };
        }
      } else {
        if (cachedValue && cachedValue !== "blacklisted") {
          return {
            message: "Token is valid (cached)",
            user: decoded,
            status: 200,
          };
        }
        if (cachedValue == "blacklisted") {
          return { message: "Token Invalid or expired", status: 401 };
        }
      }
    }
  } catch (error) {
    console.error("User Authentication failed", error);
    return { message: error?.message || "Invalid token", status: 400 };
  }
};

// Blacklist token main method
export const blacklistToken = async (token, config) => {
  try {
    const memcached = await config.getMemCacheClient();
    const secret = await config.getJwtSecret();
    const validation_api = await config.getValidationAPI();
    const redis_host = await config.getRedisHost();

    if (!token) {
      return { message: "No token provided", statusCode: 400 };
    }
    let decoded;
    // ✅ Decode token to get expiration time
    if (secret) {
      // ✅Verify token (JWT SECRET)
      try {
        decoded = jwt.verify(token, secret);
      } catch (err) {
        console.error("Invalid token:", err);
        return { err: err, statusCode: 400 };
      }
    } else if (validation_api) {
      // ✅Verify token (Validation API)
      const isValid = await validateToken(token, validation_api);
      if (isValid?.status == 200) {
        decoded = isValid?.user;
      } else {
        return {
          message: isValid?.message || "Invalid token",
          status: isValid?.status,
        };
      }
    } else {
      return { message: "Unable to verify token", status: 400 };
    }
    let expiryTime = decoded?.exp ? decoded?.exp * 1000 : decoded?.expires;
    expiryTime = new Date(expiryTime).toISOString();
    const timestamp = Math.floor(new Date(expiryTime).getTime() / 1000); // Convert to seconds
    const expTime = timestamp - Math.floor(Date.now() / 1000); // Remaining time
    let formatted_token = "AUTH_LIB_" + token;
    if (expTime <= 0) {
      return {
        message: "Token already expired",
        statusCode: 400,
        user: decoded,
      };
    }
    let cachedUrl = memcached ?? redis_host;
    let cacheType = memcached ? "memcached" : "redis";
    decoded?.expires;
    const response = await deleteToken(
      cachedUrl,
      formatted_token,
      expTime || decoded?.expires,
      cacheType
    );
    return response;
  } catch (error) {
    console.error("Error logging out:", error);
    return { message: "Error logging you out", err: error, statusCode: 500 };
  }
};
// Validate token from API
const validateToken = async (token, endpoint) => {
  let api_url = endpoint + `${token}`;
  const result = await fetch(api_url);
  if (result?.ok && result?.status === 200) {
    let formatted_result = await result.json();
    // ✅ Check if token is valid
    return { user: formatted_result, status: formatted_result?.status || 200 };
  }
  return { message: result?.statusText, status: result?.status || 500 };
};

// ✅ Function to blacklist a token in Memcached or Redis
async function deleteToken(cacheUrl, token, expTime, cacheType) {
  try {
    let result;
    if (cacheType == "memcached") {
      // Promisify the Memcached .set() method
      result = await new Promise((resolve, reject) => {
        cacheUrl.set(token, "blacklisted", expTime, (err) => {
          if (err) {
            return reject(err);
          }
          return resolve({
            message: "Token destroyed successfully",
            statusCode: 200,
          });
        });
      });
    }
    if (cacheType == "redis") {
      // Promisify the Redis .set() method
      result = await new Promise((resolve, reject) => {
        cacheUrl.set(token, "blacklisted", "EX", expTime, (err, reply) => {
          if (err) {
            return reject(err);
          }

          resolve({
            message: "Token destroyed successfully",
            statusCode: 200,
            token,
          });
        }); // Set the token to be blacklisted
      });
    }
    return result;
  } catch (error) {
    console.error("Error destroying token:", error);
    return { message: "Error destroying token", statusCode: 500 };
  }
}
