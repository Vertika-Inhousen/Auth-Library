import DBService from "./services/dbService.js";
import AuthService from "./services/authService.js";
import generateKeys from "./helper/generateKey.js";
import Config from "./config/config.js";
import { verifyToken } from "./utils.js";

export default class AuthLibrary {
  constructor(dbInstance, options, s3Data) {
    this.dbInstance = DBService.getInstance(dbInstance, options); //Initate DB Service- Singleton instance Call
    this.authService = new AuthService(this.dbInstance, options, s3Data); //Initiate Auth Service
    this.config = new Config(this.dbInstance, options, s3Data); //Initialize Config Service
    this.authenticate = this.authenticate.bind(this);
  }

  //   Register Method
  async register(userData) {
    return this.authService.register(userData);
  }
  //   Login Method
  async login(credentials) {
    return this.authService.login(credentials);
  }
  // Encrypt Password
  async encryptPassword(password) {
    return this.authService.getEncryptedPassword(password);
  }
  //   Generate Keys
  async generatePem() {
    await generateKeys(this.s3Data);
  }
  // Middleware for Authentication
  async authenticate(req, res) {
    try {
      const { authorization } = req.headers;
      if (!authorization) {
        return res
          .status(400)
          .json({ message: "Access Denied. No token provided" });
      }

      const token = authorization.split(" ")[1];
      const result = await verifyToken(token, this.config);
      if (result) {
        return res.status(result?.status).json({ message: result?.message });
      }
    } catch (error) {
      console.error("Authentication Error:", error);
      return res
        .status(500)
        .json({ message: "Error authenticating", error: error.message });
    }
  }
}
