import DBService from "./services/dbService.js";
import AuthService from "./services/authService.js";
import generateKeys from "./helper/generateKey.js";
import Config from "./config/config.js";
import { destroyToken, verifyToken } from "./utils.js";

export default class Auth {
  constructor(dbInstance, options, s3Data) {
    this.dbInstance = DBService.getInstance(dbInstance, options); //Initate DB Service- Singleton instance Call
    this.authService = new AuthService(this.dbInstance, options, s3Data); //Initiate Auth Service
    this.config = new Config(this.dbInstance, options, s3Data); //Initialize Config Service
    this.authenticate = this.authenticate.bind(this);
    // this.logout= this.logout.bind(this)
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
  async authenticate(req, res, next) {
    try {
      const { authorization } = req.headers;
      if (!authorization) {
        return { message: "Access Denied. No token provided" };
      }

      const token = authorization.split(" ")[1];
      const result = await verifyToken(token, this.config);
      if (result) {
        req.user = {
          data: result.user,
          message: result?.message,
          status: result?.status,
        };
        next();
      }
    } catch (error) {
      console.error("Authentication Error:", error);
      return { message: "Error authenticating", error: error.message };
    }
  }
  // Logout method
  async logout(authorization) {
    try {
      if (!authorization) {
        return res
          .status(400)
          .json({ message: "Access Denied. No token provided" });
      }
      const token = authorization.split(" ")[1];
      const response = await destroyToken(token, this.config);
      return response;
    } catch (error) {
      console.error("Logout Error:", error);
      return error;
    }
  }
}
