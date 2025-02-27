const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class AuthLibrary {
  constructor({ dbtype, dbConfig }, lookuptable, secretKey) {
    this.dbtype = dbtype;
    this.dbConfig = dbConfig;
    this.lookuptable = lookuptable;
    this.secretKey = secretKey;
  }

  async initDatabase() {
    try {
      if (this.dbtype === "mongodb") {
        const mongoose = require("mongoose");
        await mongoose.connect(this.dbConfig.uri);
        if (!mongoose.models[this.lookuptable]) {
            this.User = mongoose.model(this.lookuptable, new mongoose.Schema({}, { strict: false }), this.lookuptable);
          } else {
            this.User = mongoose.model(this.lookuptable);
          }
      } else if (this.dbtype === "postgres") {
        const { Sequelize, DataTypes } = require("sequelize");
        this.sequelize = new Sequelize(
          this.dbConfig.database,
          this.dbConfig.user,
          this.dbConfig.password,
          {
            host: this.dbConfig.host,
            dialect: "postgres",
          }
        );

        this.User = this.sequelize.define("User", {
          email: { type: DataTypes.STRING, allowNull: false, unique: true },
          password: { type: DataTypes.STRING, allowNull: false },
        });
      } else {
        throw new Error("Unsupported database type");
      }
    } catch (error) {
      throw new Error(`Database Error-${error}`);
    }
  }
  async checkConnection() {
    if (this.dbtype === "mongodb") {
      await this.dbConnection;
      return true;
    } else if (this.dbtype === "postgres") {
      await this.db.authenticate();
      return true;
    } else {
      throw new Error("Database type not supported");
    }
  }
  async register(userData) {
    const { email, password } = userData;

    let existingUser;
    if (this.dbtype === "mongodb") {
      existingUser = await this.User.findOne({ email });
    } else if (this.dbtype === "postgres") {
      existingUser = await this.User.findOne({ where: { email } });
    }

    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    userData.password = hashedPassword;

    let newUser;
    if (this.dbtype === "mongodb") {
      newUser = await new this.User(userData).save();
    } else if (this.dbtype === "postgres") {
      newUser = await this.User.create(userData);
    }

    return { message: "User registered successfully", user: newUser };
  }

  async login(credentials) {
    const { email, password } = credentials;
    try {
      let user;

      if (this.dbtype === "mongodb") {
        user = await this.User.findOne({ email });
      } else if (this.dbtype === "postgres") {
        user = await this.User.findOne({ where: { email } });
      }

      if (!user) throw new Error("Invalid credentials");

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new Error("Invalid credentials");

      const token = jwt.sign(
        { id: user.id, email: user.email },
        this.secretKey,
        {
          expiresIn: "1h",
        }
      );

      return { message: "Login successful", user, token };
    } catch (error) {
      throw new Error(`Error- ${error}`);
    }
  }
}

module.exports = AuthLibrary;
