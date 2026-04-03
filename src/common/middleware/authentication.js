import { SECRET_KEY } from "../../../config/config.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { get, revoke_key } from "../../DB/redis/redis.service.js";
import { verifyToken } from "../utils/token.service.js";

export const authentication = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    throw new Error("Token required", { cause: 404 });
  }

  const decoded = verifyToken({ token: authorization, secret_key: SECRET_KEY });

  if (!decoded || !decoded?.id) {
    throw new Error("Invalid token");
  }

  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: decoded.id },
  });

  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }

  if (user?.changeCredential?.getTime() > decoded.iat * 1000) {
    throw new Error("Invalid token");
  }

  const revokeToken = await get(
    revoke_key({ userId: user._id, jti: decoded.jti }),
  );
  if (revokeToken) {
    throw new Error("Token revoked");
  }

  req.user = user;
  req.decoded = decoded;

  next();
};
