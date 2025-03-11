const { Sequelize, DataTypes } = require("sequelize");

const createSQLUserModel = (sequelize) => {
  return sequelize.define("User", {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
  });
};

module.exports = createSQLUserModel;
