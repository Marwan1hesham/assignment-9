import { Router } from "express";
import * as US from "./user.service.js";
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { roleEnum } from "../../common/enum/uesr.enum.js";
import { multer_host, multer_local } from "../../common/middleware/multer.js";
import { validation } from "../../common/middleware/validation.js";
import { signInSchema, signUpSchema } from "./user.validation.js";
import { multerEnum } from "../../common/enum/multer.enum.js";

const userRouter = Router();

userRouter.post(
  "/signup",
  multer_host(multerEnum.image).single("attachment"),
  validation(signUpSchema),
  US.signUp,
);

userRouter.post("/signup/gmail", US.signUpWithGmail);
userRouter.post("/signin", validation(signInSchema), US.signIn);
userRouter.post("/refresh-token", US.tokenRefresh);
userRouter.get("/getProfile", authentication, US.getProfile);
userRouter.get("/share-profile/:id", US.shareProfile);

export default userRouter;
