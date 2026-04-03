import { successResponce } from "../../common/utils/responce.success.js";
import * as db_service from "../../DB/db.service.js";
import messageModel from "../../DB/models/message.model.js";
import userModel from "../../DB/models/user.model.js";

export const sendMessage = async (req, res, next) => {
  const { content, userId } = req.body;

  const user = await db_service.findById({
    model: userModel,
    filter: { _id: userId },
  });

  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }

  let arr = [];

  if (req.files.length) {
    for (const file of req.files) {
      arr.push(file.path);
    }
  }

  const message = await db_service.create({
    model: messageModel,
    data: {
      content,
      userId: user._id,
      attachments: arr,
    },
  });

  successResponce({ res, status: 201, data: message });
};

export const getMessage = async (req, res, next) => {
  const { messageId } = req.params;

  const message = await db_service.findOne({
    model: messageModel,
    filter: {
      _id: messageId,
      userId: req.user._id,
    },
  });

  if (!message) {
    throw new Error("Message not found", { cause: 404 });
  }

  successResponce({ res, data: message });
};

export const getMessages = async (req, res, next) => {
  const messages = await db_service.find({
    model: messageModel,
    filter: {
      userId: req.params.userId,
    },
  });

  successResponce({ res, data: messages });
};
