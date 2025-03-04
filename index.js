const express = require("express");
const bodyParser = require("body-parser");
const AuthLibrary = require("./auth");

const app = express();
app.use(bodyParser.json());
// Sample Usage
const secret_key =
  "00c59c72478aa026294f74ad38e4adffbf49184370c806aa523c84b3f9ac926ebcdf454fb88b8ba73a07a4e3450d00d8e2a7405430544eb1dd2be17cc8486b5e";

// ✅ Middleware to initialize Auth Library from request headers
app.use(async (req, res, next) => {
  const { dbtype, dburi, dbhost, dbuser, dbpassword, dbname, lookuptable } =
    req.headers;

  if (!dbtype || !lookuptable)
    return res
      .status(400)
      .json({ error: "Database or lookup table name missing" });

  const dbConfig =
    dbtype === "mongodb"
      ? { uri: dburi }
      : { host: dbhost, user: dbuser, password: dbpassword, database: dbname };
  // 🔹 Check DB connection
  req.auth = new AuthLibrary({ dbtype, dbConfig }, lookuptable, secret_key);
  await req.auth.initDatabase();
  await req.auth.checkConnection();
  console.log(`✅ Connected to ${dbtype} database successfully`);
  next();
});

// ✅ Register Route
app.post("/register", async (req, res) => {
  try {
    const user = await req.auth.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ Login Route
app.post("/login", async (req, res) => {
  try {
    const user = await req.auth.login(req.body);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
