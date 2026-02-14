import { hashSync, compareSync } from "bcrypt";

export const Hash = ({ plainText, saltRounds = 12 }) => {
  return hashSync(plainText, saltRounds);
};

export const Compare = ({ plainText, cipherText }) => {
  return compareSync(plainText, cipherText);
};
