import joi from "joi";
import { generalRules } from "../../common/utils/generalRules.js";

export const sendMessageSchema = {
  body: joi
    .object({
      content: joi.string().required(),
      userId: generalRules.id.required(),
    })
    .required(),

  files: joi.array().items(generalRules.file),
};

export const getMessageSchema = {
  params: joi
    .object({
      messageId: generalRules.id.required(),
    })
    .required(),

  files: joi.array().items(generalRules.file),
};
