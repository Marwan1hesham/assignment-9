import {
  REFRESH_SECRET_KEY,
  SALT_ROUNDS,
  SECRET_KEY,
} from "../../../config/config.service.js";
import { providerEnum } from "../../common/enum/uesr.enum.js";
import cloudinary from "../../common/utils/cloudinary.js";
import { successResponce } from "../../common/utils/responce.success.js";
import {
  decrypt,
  encrypt,
} from "../../common/utils/security/encryption.security.js";
import { Compare, Hash } from "../../common/utils/security/hash.security.js";
import {
  generateToken,
  verifyToken,
} from "../../common/utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { OAuth2Client } from "google-auth-library";

export const signUp = async (req, res, next) => {
  const { userName, email, role, cPassword, password, age, gender, phone } =
    req.body;

  const { public_id, secure_url } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "sarahaApp",
    },
  );

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
      password: Hash({
        plainText: password,
        saltRounds: SALT_ROUNDS,
      }),
      age,
      role,
      gender,
      phone: encrypt(phone),
      profilePicture: { public_id, secure_url },
    },
  });

  successResponce({ res, status: 201, data: user });
};

export const signUpWithGmail = async (req, res, next) => {
  const { idToken } = req.body;

  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken,
    audience:
      "967175535637-36mvrv0ueen18uabt7h8ugc5u92plf7m.apps.googleusercontent.com",
  });

  const payload = ticket.getPayload();
  const { email, email_verified, name, picture } = payload;

  let user = await db_service.findOne({ model: userModel, filter: { email } });

  if (!user) {
    user = await db_service.create({
      model: userModel,
      data: {
        email,
        confirmed: email_verified,
        userName: name,
        profilePicture: picture,
        provider: providerEnum.google,
      },
    });
  }

  if (user.provider == providerEnum.system) {
    throw new Error("please log in on system", { cause: 400 });
  }

  const access_token = generateToken({
    payload: { id: user._id, email: user.email },
    secret_key: SECRET_KEY,
    options: {
      expiresIn: 60 * 10,
      noTimestamp: true,
    },
  });

  successResponce({
    res,
    message: "Logged in successfully",
    data: access_token,
  });
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
    secret_key: SECRET_KEY,
    options: {
      expiresIn: 60,
      noTimestamp: true,
    },
  });

  const refresh_token = generateToken({
    payload: { id: user._id, email: user.email },
    secret_key: REFRESH_SECRET_KEY,
    options: {
      expiresIn: "1y",
      noTimestamp: true,
    },
  });

  successResponce({
    res,
    message: "Logged in successfully",
    data: {
      access_token,
      refresh_token,
    },
  });
};

export const tokenRefresh = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    throw new Error("Token required", { cause: 404 });
  }

  const decoded = verifyToken({
    token: authorization,
    secret_key: REFRESH_SECRET_KEY,
  });

  if (!decoded || !decoded?.id) {
    throw new Error("Invalid token");
  }

  const user = await db_service.findById({
    model: userModel,
    filter: { _id: decoded.id },
    select: "-password -_id",
  });

  const access_token = generateToken({
    payload: { id: user._id, email: user.email },
    secret_key: REFRESH_SECRET_KEY,
    options: {
      expiresIn: "1y",
      noTimestamp: true,
    },
  });

  successResponce({
    res,
    data: access_token,
  });
};

export const getProfile = async (req, res, next) => {
  successResponce({
    res,
    data: { ...req.user._doc, phone: decrypt(req.user.phone) },
  });
};

export const shareProfile = async (req, res, next) => {
  const { id } = req.params;

  const user = await db_service.findById({
    model: userModel,
    filter: { id },
    select: "-password",
  });

  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }

  user.phone = decrypt(user.phone);

  successResponce({ res, data: user });
};
