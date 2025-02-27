const users = []; // Temporary in-memory user store

const db = {
  async findUserByEmail(email) {
    return users.find((user) => user.email === email);
  },

  async createUser(userData) {
    users.push(userData);
    return userData;
  },
};

module.exports = db;
