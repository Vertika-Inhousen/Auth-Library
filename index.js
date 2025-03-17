import express from "express";
import bodyParser from "body-parser";
import connectDB from "./db.js";
import AuthLibrary from "./server.js";

const app = express();
app.use(bodyParser.json());
// Sample Usage
// connect and create DB Instance
const dbInstance = await connectDB();
let publicKeyPem;

// Library Options
const options = {
  lookuptable: "users",
};
// Initalise library
const auth = new AuthLibrary(dbInstance, options);


// Sample Register API
app.post("/api/register", async (req, res) => {
  const { email, password } = req?.body;

  try {
    const encryptedPassword = auth.encryptPassword(password, publicKeyPem);
    const user = await auth.register({
      email: email,
      password: encryptedPassword,
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
    const encryptedPassword = await auth.encryptPassword(password, publicKeyPem)
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

// Load Public Key
app.get("/api/public-key", async(req, res) => {
  const publicKey = await auth.generatePublicKey(); 
  publicKeyPem = publicKey;
  res.json({ publicKey: publicKey,status:200 });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
