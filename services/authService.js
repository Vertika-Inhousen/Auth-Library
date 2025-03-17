
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { hashPassword, decryptPassword } from "../utils.js";
import fs from "fs";
const secret_key =
  "00c59c72478aa026294f74ad38e4adffbf49184370c806aa523c84b3f9ac926ebcdf454fb88b8ba73a07a4e3450d00d8e2a7405430544eb1dd2be17cc8486b5e";

export default class AuthService {
  constructor(dbInstance, options) {
    this.dbInstance = dbInstance;
    this.encryptPassword = options?.encryptPassword ?? true;
    this.secret_key = process.env.JWT_SECRET || secret_key;
    this.saltRounds = options?.saltRounds ?? 10;
    (this.dbtype = dbInstance.dbtype),
      (this.lookupTable = dbInstance?.lookupTable);
  }

  //   Register Method
  async register(userData) {
    try {
      const { email, password } = userData;
      const decryptedPassword = decryptPassword(password);
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
          where: { id: newUser.id },
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
      //   Check for emial and password
      if (!email || !password) {
        return { message: "Email and password are required", status: 400 };
      }
      const decryptedPassword = decryptPassword(password);
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
      if (this.secret_key) {
        const token = jwt.sign(
          { id: user.id, email: user.email },
          this.secret_key,
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
      }
    } catch (error) {
      console.log("Error while login", error);
      throw new Error(`Login Error - ${error.message}`);
    }
  }
  async generatePublicKey() {
    const publicKeyPem = fs.readFileSync("public.pem", "utf8");
    return publicKeyPem;
  }
}
