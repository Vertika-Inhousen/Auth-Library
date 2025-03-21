const { Sequelize, DataTypes } = require("sequelize");

const createSQLUserModel = (sequelize) => {
  return sequelize.define(
    "User", // Sequelize model name
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true, // Ensures it's a valid email
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true, // Enables automatic createdAt & updatedAt
      tableName: "users", // Ensures table name is `users`, not `User`
      freezeTableName: true, // Prevents Sequelize from pluralizing the table name
      createdAt: "createdat", // Map Sequelize timestamps to lowercase columns
      updatedAt: "updatedat",
    }
  );
};

module.exports = createSQLUserModel;
