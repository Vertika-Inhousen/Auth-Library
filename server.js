import express from "express";
import bodyParser from "body-parser";
import { connectDB, connectSQLDB } from "./db.js";
import Auth from "./auth.js";
import { createS3Client } from "./config/s3Config.js";
import memjs from "memjs";
import Redis from "ioredis";

const app = express();
app.use(bodyParser.json());
// Sample Usage
// connect and create DB Instance
// const dbInstance = await connectDB();
const dbInstance = await connectSQLDB();
const s3Data = createS3Client();
const jwt_secret = process.env.JWT_SECRET;
const memcachehost = memjs.Client.create(
  process.env.MEMCACHED_URL || "localhost:11211"
);
const redis = new Redis("redis://localhost:6379");
const validation_api = 'https://api.moodus.io/auth/validate-token?access_token='

// Library Options
const options = {
  lookuptable: "users",
  // jwt_secret: jwt_secret,
  // mem_cache_host: memcachehost,
  redis_host:redis,
  validation_api:validation_api
};
// Initalise library
const auth = new Auth(dbInstance, options, s3Data);

// Sample Register API
app.post("/api/register", async (req, res) => {
  const { email, password, username } = req?.body;
  try {
    const encryptedPassword = await auth.encryptPassword(password);
    const user = await auth.register({
      email: email,
      password: encryptedPassword,
      username: username,
    });
    return res
      .status(user?.status)
      .json({ message: user?.message, data: user?.user });
  } catch (error) {
    console.log("Error registering user", error);
    return res.status(500).json({ error: error?.message });
  }
});

// Sample Login API
app.post("/api/login", async (req, res) => {
  const { email, password } = req?.body;
  try {
    const encryptedPassword = await auth.encryptPassword(password);
    const user = await auth.login({
      email: email,
      password: encryptedPassword,
    });
    return res
      .status(user?.status || 500)
      .json({ message: user?.message || "Network error", data: user?.data });
  } catch (error) {
    console.log("Error logging in user", error);
    return res.status(500).json({ message: error?.message });
  }
});
// Generate PEM Files
app.get("/api/generatePem", async (req, res) => {
  try {
    const pem = await auth.generatePem(storage);
    return res
      .status(200)
      .json({ message: "PEM Files generated successfully" });
  } catch (error) {
    console.log("Error generating pem files", error);
  }
});

app.get("/api/profile", auth.authenticate, async (req, res) => {
  console.log("req", req?.body);
  return res.status(200).json({ data: req?.user });
});
app.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization;
    let response = await auth.logout(token);
    return res
      .status(200)
      .json({ message: response?.message, result: response });
  } catch (Error) {
    console.log("Error logging out user", Error);
    return res.status(500).json({ message: Error.message });
  }
});
app.get("/", (req, res) => {
  res.send("Welcome!");
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
