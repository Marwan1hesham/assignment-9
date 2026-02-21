import { hashSync, compareSync } from "bcrypt";

export const Hash = ({ plainText, saltRounds = process.env.SALT_ROUNDS }) => {
  return hashSync(plainText, Number(saltRounds));
};

export const Compare = ({ plainText, cipherText }) => {
  return compareSync(plainText, cipherText);
};
