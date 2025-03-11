import bcrypt from "bcryptjs";
export const hashPassword = async (password, saltRounds) => {
  let hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};
