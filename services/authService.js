const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { hashPassword } = require("../utils");
const { secretKey } = require("../config");
const secret_key = secretKey;


class AuthService {
  constructor(dbInstance, options) {
    this.dbInstance = dbInstance;
    this.secretKey = dbInstance.secret_key;
    this.encryptPassword = options?.encryptPassword ?? true;
    this.secret_key = secret_key;
    this.saltRounds = options?.saltRounds ?? 10;
    (this.dbtype = dbInstance.dbtype),
      (this.lookupTable = dbInstance?.lookupTable);
  }

  //   Register Mathos
  async register(userData) {
    try {
      const { email, password } = userData;
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
        userData.password = await hashPassword(password,this.saltRounds)
      }
      // Save User in Database
      let newUser;
      if (this.dbtype === "mongo") {
        newUser = await new this.dbInstance.User(userData).save();
      } else if (this.dbtype === "sql") {
        newUser = await this.dbInstance.User.create(userData);
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
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return {
          message: "Invalid credentials- Incorrect Password",
          status: 400,
        };
      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        this.secretKey,
        { expiresIn: "1h" }
      );

      return { message: "Login successful", user, token, status: 200 };
    } catch (error) {
      console.log("Error while login", error);
      throw new Error(`Login Error - ${error.message}`);
    }
  }
}

module.exports = AuthService;
