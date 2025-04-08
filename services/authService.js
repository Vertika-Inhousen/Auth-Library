import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { hashPassword, decryptPassword, encryptPassword } from "../utils.js";
import { getPublicKey } from "../services/keymanager.js";

export default class AuthService {
  constructor(dbInstance, options, s3Data) {
    this.dbInstance = dbInstance;
    this.encryptPassword = options?.encryptPassword ?? true;
    this.saltRounds = options?.saltRounds ?? 10;
    this.jwt_secret = options?.jwt_secret;
    (this.dbtype = dbInstance.dbtype),
      (this.lookupTable = dbInstance?.lookupTable),
      (this.s3Data = s3Data);
  }
  //   Register Method
  async register(userData) {
    try {
      const { email, password } = userData;
      const decryptedPassword = await decryptPassword(password, this.s3Data);
      //   Check for email and password
      if (!email || !password) {
        return { message: "Email and password are required", status: 400 };
      }
      let existingUser;
      // Check if user already exists
      if (this.dbtype === "mongo") {
        existingUser = await this.dbInstance.User.findOne({ email });
      } else if (this.dbtype === "sql") {
        existingUser = await this.dbInstance.User.findOne({ where: { email } });
      }

      if (existingUser) throw new Error("User already exists");
      // Encrypt password
      if (this.encryptPassword) {
        userData.password = await hashPassword(
          decryptedPassword,
          this.saltRounds
        );
      }
      // Save User in Database
      let newUser;
      if (this.dbtype === "mongo") {
        newUser = await new this.dbInstance.User(userData).save();
        newUser = await this.dbInstance.User.findById(newUser._id).select(
          "-password"
        ); // Exclude password
      } else if (this.dbtype === "sql") {
        newUser = await this.dbInstance.User.create(userData);
        newUser = await this.dbInstance.User.findOne({
          where: { email: newUser.email },
          attributes: { exclude: ["password"] }, // Exclude password
        });
      }
      // Remove password manually before sending response
      if (newUser && newUser.password) {
        usnewUserer = newUser.toObject
          ? user.toObject()
          : newUser.get({ plain: true }); // Convert to plain object
        delete newUser.password; // Remove password field
      }
      return {
        message: "User registered successfully",
        user: newUser,
        status: 201,
      };
    } catch (error) {
      throw new Error(`Registration Error - ${error.message}`);
    }
  }
  //   Login Method
  async login(credentials) {
    const { email, password } = credentials;

    try {
      let user;
      //   Check for email and password
      if (!email || !password) {
        return { message: "Email and password are required", status: 400 };
      }
      if (!this.s3Data) {
        return { message: "S3 Credential is required", status: 400 };
      }
      const decryptedPassword = await decryptPassword(password, this.s3Data);
      // Find user
      if (this.dbtype === "mongo") {
        user = await this.dbInstance.User.findOne({ email });
      } else if (this.dbtype === "sql") {
        user = await this.dbInstance.User.findOne({ where: { email } });
      }
      // Check for user
      if (!user)
        return { message: "Invalid credentials- User not found", status: 400 };
      // Check for password match
      const isMatch = await bcrypt.compare(decryptedPassword, user.password);
      if (!isMatch)
        return {
          message: "Invalid credentials- Incorrect Password",
          status: 400,
        };
      // Remove password manually before sending response
      if (user && user.password) {
        user = user.toObject ? user.toObject() : user.get({ plain: true }); // Convert to plain object
        delete user.password; // Remove password field
      }
      // Generate token
      if (this.jwt_secret) {
        const token = jwt.sign(
          { id: user.id, email: user.email, username: user.username || "" },
          this.jwt_secret,
          {
            expiresIn: "1h",
          }
        );
        return {
          message: "Login successful",
          data: {
            user: user || {}, // User object
            token: token || "", // JWT Token
          },
          status: 200, // HTTP Status Code
        };
      } else {
        return {
          message: "Please provide a valid JWT secret key",
          status: 500,
        };
      }
    } catch (error) {
      console.log("Error while login", error);
      throw new Error(`Login Error - ${error.message}`);
    }
  }

  // Encrypt Password
  async getEncryptedPassword(password) {
    const publicKey = await getPublicKey(this.s3Data);
    if (!publicKey) {
      throw new Error("Public Key is missing");
    }
    if (!password) {
      throw new Error("Password is required for encryption");
    }
    const encryptedPassword = await encryptPassword(password, publicKey);
    return encryptedPassword;
  }
}
