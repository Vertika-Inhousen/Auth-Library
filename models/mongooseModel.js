const mongoose = require("mongoose");

const createMongoUserModel = (lookuptable) => {
  if (!mongoose.models[lookuptable]) {
    return mongoose.model(
      lookuptable,
      new mongoose.Schema({}, { strict: false }),
      lookuptable
    );
  }
  return mongoose.model(lookuptable);
};

module.exports = createMongoUserModel;
