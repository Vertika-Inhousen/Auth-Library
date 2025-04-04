import express from "express";
import bodyParser from "body-parser";
import { connectDB, connectSQLDB } from "./db.js";
import Auth from "./auth.js";
import { createS3Client } from "./config/s3Config.js";

const app = express();
app.use(bodyParser.json());
// Sample Usage
// connect and create DB Instance
// const dbInstance = await connectDB();
const dbInstance = await connectSQLDB();
const s3Data = createS3Client();
const jwt_secret = process.env.JWT_SECRET;
// Library Options
const options = {
  lookuptable: "users",
  jwt_secret:jwt_secret
};
// Initalise library
const auth = new Auth(dbInstance, options,s3Data);

// Sample Register API
app.post("/api/register", async (req, res) => {
  const { email, password,username } = req?.body;
  try {
    const encryptedPassword = await auth.encryptPassword(password);
    const user = await auth.register({
      email: email,
      password: encryptedPassword,
      username:username
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
app.get("/api/generatePem",async(req,res)=>{
  try{
    const pem = await auth.generatePem(storage);
    return res.status(200).json({message:"PEM Files generated successfully"});
  }
  catch(error){
    console.log('Error generating pem files',error)
  }
})

app.get('/profile',auth.authenticate,async (req,res)=>{
console.log('data',req)
})
app.get("/", (req, res) => {
  res.send("Welcome!");
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
