import { Sequelize } from "sequelize";
import createMongoUserModel from "../models/mongooseModel.js";
import createSQLUserModel from "../models/sequelizeModel.js";

class DBService {
  static instance = null; // Static variable to store the singleton instance

  constructor(dbInstance, options) {
    if (DBService.instance) {
      console.log("🔄 Returning existing DBService instance...");
      return DBService.instance; // Return the same instance if already exists
    }

    if (!dbInstance) throw new Error("dbInstance is required");

    this.dbInstance = dbInstance;
    this.lookuptable = options?.lookuptable || this.dbInstance.lookuptable;
    this.dbtype = "";
    this.User = null;
    this.sequelize = null;
    this.initError = null;

    this.initPromise = this.initDatabase()
      .then(() => console.log("✅ Database initialized successfully"))
      .catch((err) => {
        console.error("❌ Database initialization failed:", err);
        this.initError = err; // Store error for future reference
      });

    DBService.instance = this; // Store the instance in the static property
  }

  async initDatabase() {
    try {
      if (!this.lookuptable) {
        throw new Error("lookuptable is required for database initialization");
      }
      if (this.dbInstance?.connection?.client) {
        console.log("✅ Connected to MongoDB");
        this.dbtype = "mongo";
        this.User = createMongoUserModel(this.lookuptable);
      } else if (this.dbInstance?.config) {
        console.log("✅ Connected to SQL Database:");
        this.dbtype = "sql";
        if (!this.dbInstance.dialect) {
          throw Error("Dialect is required");
        }
        this.sequelize = new Sequelize(
          this.dbInstance?.config.database,
          this.dbInstance?.config?.username || this.dbInstance?.config?.user,
          this.dbInstance?.config?.password,
          {
            host: this.dbInstance?.config?.host,
            dialect: this.dbInstance.dialect,
            logging: false,
          }
        );

        await this.sequelize.authenticate(); // Ensure the connection is valid
        console.log("✅ Sequelize authenticated successfully");

        this.User = createSQLUserModel(this.sequelize, this.lookuptable);
      } else {
        throw new Error("Unsupported database type");
      }
    } catch (error) {
      throw new Error(`Database Error - ${error.message}`);
    }
  }

  static getInstance(dbInstance, options) {
    if (!DBService.instance) {
      DBService.instance = new DBService(dbInstance, options);
    }
    return DBService.instance;
  }
}

export default DBService;
