import { providerEnum } from "../../common/enum/uesr.enum.js";
import { successResponce } from "../../common/utils/responce.success.js";
import {
  decrypt,
  encrypt,
} from "../../common/utils/security/encryption.security.js";
import { Compare, Hash } from "../../common/utils/security/hash.security.js";
import { generateToken } from "../../common/utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";

export const signUp = async (req, res, next) => {
  const { userName, email, cPassword, password, age, gender, phone } = req.body;
  if (await db_service.findOne({ model: userModel, filter: { email } })) {
    throw new Error("Email already exists", { cause: 409 });
  }
  if (password !== cPassword) {
    throw new Error("invalid password", { cause: 400 });
  }
  const user = await db_service.create({
    model: userModel,
    data: {
      userName,
      email,
      password: Hash({ plainText: password }),
      age,
      gender,
      phone: encrypt(phone),
    },
  });
  successResponce({ res, status: 201, data: user });
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: { email, provider: providerEnum.system },
  });
  if (!user) {
    throw new Error("invalid email or password", { cause: 400 });
  }

  if (!Compare({ plainText: password, cipherText: user.password })) {
    throw new Error("invalid email or password", { cause: 400 });
  }

  const access_token = generateToken({
    payload: { id: user._id, email: user.email },
    secret_key: "marwan",
    options: {
      expiresIn: 60 * 10,
      noTimeStamp: true,
    },
  });

  successResponce({ res, data: access_token });
};

export const getProfile = async (req, res, next) => {
  successResponce({
    res,
    data: { ...req.user._doc, phone: decrypt(req.user.phone) },
  });
};
