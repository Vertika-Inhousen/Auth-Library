import DBService from "./services/dbService.js";
import AuthService from "./services/authService.js";

export default class AuthLibrary {
  constructor(dbInstance, options) {
    this.dbInstance = DBService.getInstance(dbInstance, options); //Initate DB Service- Singleton instance Call
    this.authService = new AuthService(this.dbInstance, options); //Initiate Auth Service
  }

  //   Register Method
  async register(userData) {
    return this.authService.register(userData);
  }

  //   Login Method
  async login(credentials) {
    return this.authService.login(credentials);
  }
  async generatePublicKey() {
    return this.authService.generatePublicKey();
  }
  async encryptPassword(password) {
    return this.authService.getEncryptedPassword(password);
  }
}
