import { Router } from "express";
import * as US from "./user.service.js";
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { roleEnum } from "../../common/enum/uesr.enum.js";

const userRouter = Router();

userRouter.post("/signup", US.signUp);
userRouter.post("/signup/gmail", US.signUpWithGmail);
userRouter.post("/signin", US.signIn);
userRouter.get(
  "/getProfile",
  authentication,
  authorization([roleEnum.admin]),
  US.getProfile,
);

export default userRouter;
