import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { verifyToken } from "../utils/token.service.js";

export const authentication = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    throw new Error("Token required", { cause: 404 });
  }

  const decoded = verifyToken({ token: authorization, secret_key: "marwan" });

  if (!decoded || !decoded?.id) {
    throw new Error("Invalid token");
  }

  const user = await db_service.findById({
    model: userModel,
    filter: { _id: decoded.id },
    select: "-password",
  });

  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }

  req.user = user;

  next();
};
