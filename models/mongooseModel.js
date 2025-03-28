import mongoose from "mongoose";
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

export default createMongoUserModel;
