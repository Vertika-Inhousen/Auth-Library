const DBService = require("./services/dbService");
const AuthService = require("./services/authService");

class AuthLibrary {
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
}

module.exports = AuthLibrary;
