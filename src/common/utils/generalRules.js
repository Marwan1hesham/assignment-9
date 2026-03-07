import joi from "joi";

export const generalRules = {
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
  cPassword: joi.string().valid(joi.ref("password")),

  file: joi.object({
    fieldname: joi.string().required(),
    originalname: joi.string().required(),
    encoding: joi.string().required(),
    mimetype: joi.string().required(),
    destination: joi.string().required(),
    filename: joi.string().required(),
    path: joi.string().required(),
    size: joi.number().required(),
  }),
};
