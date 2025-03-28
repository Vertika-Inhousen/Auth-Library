import { DataTypes } from "sequelize";

const createSQLUserModel = (sequelize, table) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true, // ✅ make username optional
      },
    },
    {
      timestamps: true,
      tableName: table,
      freezeTableName: true,
      createdAt: "createdat",
      updatedAt: "updatedat",
    }
  );

  // ✅ Sync the model: creates table if not exists or alters if needed
  User.sync({ alter: true }) // alter: true keeps existing data but updates schema
    .then(() => {
      console.log(`✅ Table "${table}" is ready.`);
    })
    .catch((err) => {
      console.error(`❌ Error syncing "${table}" table:`, err);
    });

  return User;
};

export default createSQLUserModel;
