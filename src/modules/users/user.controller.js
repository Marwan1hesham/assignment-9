import { Router } from "express";
import * as US from "./user.service.js";
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { roleEnum } from "../../common/enum/uesr.enum.js";
import { multer_host, multer_local } from "../../common/middleware/multer.js";
import { validation } from "../../common/middleware/validation.js";
import * as UV from "./user.validation.js";
import { multerEnum } from "../../common/enum/multer.enum.js";

const userRouter = Router();

userRouter.post(
  "/signup",
  multer_host(multerEnum.image).single("attachment"),
  validation(UV.signUpSchema),
  US.signUp,
);

userRouter.patch(
  "/confirm-email",
  validation(UV.confirmEmailSchema),
  US.confirmEmail,
);

userRouter.post("/resend-otp", US.resendOtp);

userRouter.post("/signup/gmail", US.signUpWithGmail);

userRouter.post("/signin", validation(UV.signInSchema), US.signIn);

userRouter.post("/confirm-login", US.confirmLogin);

userRouter.post("/enable-2step", authentication, US.enableTwoStep);

userRouter.patch("/confirm-2step", authentication, US.confirmTwoStep);

userRouter.post("/refresh-token", US.tokenRefresh);

userRouter.get("/profile", authentication, US.getProfile);

userRouter.patch(
  "/update-password",
  authentication,
  validation(UV.updatePasswordSchema),
  US.updatePassword,
);

userRouter.get(
  "/share-profile/:id",
  validation(UV.shareProfileSchema),
  US.shareProfile,
);

userRouter.post("/logout", authentication, US.logout);

export default userRouter;
