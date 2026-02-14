import { Router } from "express";
import * as US from "./user.service.js";
import { authentication } from "../../common/middleware/authentication.js";

const userRouter = Router();

userRouter.post("/signup", US.signUp);
userRouter.post("/signin", US.signIn);
userRouter.get("/getProfile", authentication, US.getProfile);

export default userRouter;
