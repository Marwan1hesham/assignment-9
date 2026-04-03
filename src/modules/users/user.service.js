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
import { LoginTicket, OAuth2Client } from "google-auth-library";
import { randomBytes, randomUUID } from "crypto";
import {
  block_login_key,
  block_otp_key,
  confirm_two_step_key,
  deleteKey,
  email_cache,
  get,
  get_key,
  incr,
  keys,
  max_login_key,
  max_otp_key,
  otp_key,
  setValue,
  ttl,
  two_step_otp_key,
} from "../../DB/redis/redis.service.js";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email.js";
import { emailTemplate } from "../../common/utils/email/email.template.js";
import { eventEmitter } from "../../common/utils/email/email.events.js";
import { emailEnum } from "../../common/enum/email.enum.js";

const sendEmailOtp = async ({ email, subject }) => {
  const isBlocked = await ttl(block_otp_key({ email }));
  if (isBlocked > 0) {
    throw new Error(
      `You are blocked, please try again after ${isBlocked} seconds`,
    );
  }

  const otpTTl = await ttl(otp_key({ email, subject }));
  if (otpTTl > 0) {
    throw new Error(`You can resend otp after ${ttl} seconds`);
  }

  const maxOtp = await get(max_otp_key({ email }));
  if (maxOtp >= 3) {
    await setValue({ key: block_otp_key({ email }), value: 1, ttl: 60 });
    throw new Error("You have exceeded the maximum number of tries");
  }

  const otp = await generateOtp();
  eventEmitter.emit(emailEnum.confirmEmail, async () => {
    await sendEmail({
      to: email,
      subject: "Welcome to Saraha App",
      html: emailTemplate(otp),
    });
  });

  await setValue({
    key: otp_key({ email, subject }),
    value: Hash({ plainText: `${otp}` }),
    ttl: 60 * 2,
  });

  await incr(max_otp_key({ email }));
};

export const signUp = async (req, res, next) => {
  const { userName, email, role, cPassword, password, age, gender, phone } =
    req.body;

  if (req.file) {
    var { public_id, secure_url } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: "sarahaApp" },
    );
  }

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

  const otp = await generateOtp();
  await sendEmail({
    to: email,
    subject: "Welcome to Saraha App",
    html: emailTemplate(otp),
  });

  await setValue({
    key: otp_key({ email, subject: emailEnum.confirmEmail }),
    value: Hash({ plainText: `${otp}` }),
    ttl: 60 * 2,
  });

  await setValue({
    key: max_otp_key({ email }),
    value: 1,
    ttl: 60,
  });

  successResponce({ res, status: 201, data: user });
};

export const confirmEmail = async (req, res, next) => {
  const { email, code } = req.body;

  const otpValue = await get(otp_key({ email }));
  if (!otpValue) {
    throw new Error("Otp expired");
  }

  if (!Compare({ plainText: code, cipherText: otpValue })) {
    throw new Error("Invalid otp");
  }

  const user = db_service.findOneAndUpdate({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: false },
      provider: providerEnum.system,
    },
    update: { confirmed: true },
  });

  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }

  await deleteKey(otp_key({ email }));

  successResponce({ res, message: "Email confirmed successfully" });
};

export const resendOtp = async (req, res, next) => {
  const { email } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: false },
      provider: providerEnum.system,
    },
  });

  if (!user) {
    throw new Error("User not found or already confirmed", { cause: 404 });
  }

  await sendEmailOtp({ email, subject: emailEnum.confirmEmail });

  successResponce({ res });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: true },
      provider: providerEnum.system,
    },
  });

  if (!user) {
    throw new Error("User not found or already confirmed", { cause: 404 });
  }

  await sendEmailOtp({ email, subject: emailEnum.forgetPassword });
  successResponce({ res });
};

export const resetPassword = async (req, res, next) => {
  const { email, code, password } = req.body;

  const otpValue = await get(
    otp_key({ email, subject: emailEnum.forgetPassword }),
  );
  if (!otpValue) {
    throw new Error("Otp expired");
  }

  if (!Compare({ plainText: code, cipherText: otpValue })) {
    throw new Error("Invalid otp");
  }

  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: true },
      provider: providerEnum.system,
    },
    update: {
      password: Hash({ plainText: password }),
      changeCredential: new Date(),
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await deleteKey(otp_key({ email, subject: emailEnum.forgetPassword }));

  successResponce({ res });
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

  const isBlocked = await get(block_login_key({ email }));
  if (isBlocked) {
    const blockTTl = await ttl(block_login_key({ email }));
    throw new Error(
      `You are blocked, please try again after ${blockTTl} seconds`,
    );
  }

  const max_tries = await get(max_login_key({ email }));
  if (!max_tries) {
    await setValue({
      key: max_login_key({ email }),
      value: 1,
      ttl: 60 * 3,
    });
  }

  const user = await db_service.findOne({
    model: userModel,
    filter: { email, provider: providerEnum.system },
  });
  if (!user) {
    await incr(max_login_key({ email }));
    if (max_tries >= 5) {
      await setValue({
        key: block_login_key({ email }),
        value: 1,
        ttl: 60 * 5,
      });
      throw new Error("You have exceeded the maximum number of tries");
    }
    throw new Error("invalid email or password", { cause: 400 });
  }

  if (!Compare({ plainText: password, cipherText: user.password })) {
    await incr(max_login_key({ email }));
    if (max_tries >= 5) {
      await setValue({
        key: block_login_key({ email }),
        value: 1,
        ttl: 60 * 5,
      });
      throw new Error("You have exceeded the maximum number of tries");
    }
    throw new Error("invalid email or password", { cause: 400 });
  }

  if (user.twoStepVerification) {
    const otp = await generateOtp();
    await sendEmail({
      to: email,
      subject: `Saraha App`,
      html: `<p>Your confirmation code is ${otp}</p>`,
    });

    const otpHashed = Hash({ plainText: `${otp}` });
    await setValue({
      key: confirm_two_step_key({ email }),
      value: `${otpHashed}`,
      ttl: 60 * 2,
    });

    const tempToken = randomUUID();
    await setValue({
      key: email_cache({ tempToken }),
      value: email,
      ttl: 60 * 2,
    });

    successResponce({
      res,
      message: "Check your Gmail to get your confirmation code",
      data: { tempToken },
    });
  } else {
    await deleteKey(max_login_key({ email }));

    const jwtid = randomUUID();

    const access_token = generateToken({
      payload: { id: user._id, email: user.email },
      secret_key: SECRET_KEY,
      options: {
        expiresIn: 60 * 10,
        jwtid,
      },
    });

    const refresh_token = generateToken({
      payload: { id: user._id, email: user.email },
      secret_key: REFRESH_SECRET_KEY,
      options: {
        expiresIn: "1y",
        jwtid,
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
  }
};

export const confirmLogin = async (req, res, next) => {
  const { code, tempToken } = req.body;

  const email = await get(email_cache({ tempToken }));
  const hashedOtp = await get(confirm_two_step_key({ email }));

  if (!Compare({ plainText: code, cipherText: hashedOtp })) {
    throw new Error("Invalid otp");
  }

  const jwtid = randomUUID();

  const user = await db_service.findOne({
    model: userModel,
    filter: { email },
  });

  const access_token = generateToken({
    payload: { id: user._id, email: user.email },
    secret_key: SECRET_KEY,
    options: {
      expiresIn: 60 * 10,
      jwtid,
    },
  });

  const refresh_token = generateToken({
    payload: { id: user._id, email: user.email },
    secret_key: REFRESH_SECRET_KEY,
    options: {
      expiresIn: "1y",
      jwtid,
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

export const enableTwoStep = async (req, res, next) => {
  const email = req.user.email;

  const otp = await generateOtp();
  await sendEmail({
    to: email,
    subject: `Saraha app`,
    html: `<p>Your code is ${otp}</p>`,
  });
  const otpHashed = Hash({ plainText: `${otp}` });

  await setValue({
    key: two_step_otp_key({ email }),
    value: otpHashed,
    ttl: 60 * 3,
  });

  successResponce({ res, message: "Otp sent to your Gmail" });
};

export const confirmTwoStep = async (req, res, next) => {
  const { code } = req.body;

  const hashedOtp = await get(two_step_otp_key({ email: req.user.email }));
  if (!Compare({ plainText: code, cipherText: hashedOtp })) {
    throw new Error("Invalid otp");
  }

  req.user.twoStepVerification = true;
  req.user.save();

  successResponce({
    res,
    message: "Two step verification enabled successfully",
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
      expiresIn: 60 * 10,
    },
  });

  successResponce({
    res,
    data: access_token,
  });
};

export const getProfile = async (req, res, next) => {
  const key = `profile::${req.user._id}`;

  const userExist = await get(key);

  if (userExist) {
    return successResponce({ res, data: userExist });
  }

  await setValue({ key, value: req.user, ttl: 60 });

  successResponce({
    res,
    data: { ...req.user._doc, phone: decrypt(req.user.phone) },
  });
};

export const shareProfile = async (req, res, next) => {
  const { id } = req.params;

  const user = await db_service.findById({
    model: userModel,
    filter: { _id: id },
    select: "-password",
  });

  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }

  user.phone = decrypt(user.phone);

  successResponce({ res, data: user });
};

export const updateProfile = async (req, res, next) => {
  let { firstName, lastName, gender, phone } = req.body;

  if (phone) {
    phone = encrypt(phone);
  }

  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: req.user._id },
    update: { firstName, lastName, gender, phone },
  });

  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }

  await deleteKey(`profile::${req.user._id}`);

  successResponce({ res, data: user });
};

export const updatePassword = async (req, res, next) => {
  let { oldPassword, newPassword } = req.body;

  if (!Compare({ plainText: oldPassword, cipherText: req.user.password })) {
    throw new Error("Invalid old password");
  }

  const hash = Hash({ plainText: newPassword });
  req.user.password = hash;

  req.user.save();

  successResponce({ res });
};

export const logout = async (req, res, next) => {
  const { flag } = req.query;

  if (flag == "all") {
    req.user.changeCredential = new Date();
    await req.user.save();

    await deleteKey(await keys(get_key({ userId: req.user._id })));
  } else {
    await setValue({
      key: `revoke_token::${req.user._id}::${req.decoded.jti}`,
      value: `${req.decoded.jti}`,
      ttl: req.decoded.exp - Math.floor(Date.now() / 1000),
    });
  }

  successResponce({ res });
};
