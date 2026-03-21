import joi from "joi";
import { genderEnum } from "../../common/enum/uesr.enum.js";
import { generalRules } from "../../common/utils/generalRules.js";

export const signUpSchema = {
  body: joi
    .object({
      userName: joi.string().min(5).max(40).required(),
      email: generalRules.email.required(),
      password: generalRules.password.required(),
      cPassword: generalRules.cPassword,
      age: joi.number().min(18).required(),
      gender: joi.string().valid(...Object.values(genderEnum)),
      phone: joi.string(),
    })
    .required()
    .with("password", "cPassword"),

  file: generalRules.file.required().messages({
    "any.required": "file is required",
  }),
};

export const confirmEmailSchema = {
  body: joi
    .object({
      email: generalRules.email.required(),
      code: joi.string().regex(/^\d{6}$/).required(),
    })
    .required(),
};

export const signInSchema = {
  body: joi
    .object({
      email: joi.string().email().required(),
      password: joi.string().min(8).required(),
    })
    .required(),
};

export const shareProfileSchema = {
  params: joi
    .object({
      id: generalRules.id.required(),
    })
    .required(),
};

export const updateProfileSchema = {
  body: joi
    .object({
      firstName: joi.string().min(5).max(40),
      lastName: joi.string().min(5).max(40),
      gender: joi.string().valid(...Object.values(genderEnum)),
      phone: joi.string(),
    })
    .required(),
};

export const updatePasswordSchema = {
  body: joi
    .object({
      newPassword: generalRules.password.required(),
      cPassword: joi.string().valid(joi.ref("newPassword")),
      oldPassword: generalRules.password.required(),
    })
    .required(),
};
