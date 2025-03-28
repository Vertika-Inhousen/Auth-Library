// config/loadEnv.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadLibraryEnv() {
  const envPath = path.resolve(__dirname, ".env"); // update path if needed
  dotenv.config({ path: envPath, override: true });
}
