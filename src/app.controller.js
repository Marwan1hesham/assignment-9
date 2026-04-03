import express from "express";
import checkConnectionDB from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import { successResponce } from "./common/utils/responce.success.js";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { PORT, WHITE_LIST } from "../config/config.service.js";
import { reddisConnection } from "./DB/redis/redis.connect.js";
import messageRouter from "./modules/messages/message.controller.js";
const app = express();
const port = PORT;

const bootstrap = () => {
  const limiter = rateLimit({
    windowMs: 60 * 3 * 1000,
    limit: 5,
    statusCode: 400,
    handler: (req, res, next) => {
      return res
        .status(400)
        .json({ message: "Too many requests, please try again later" });
    },
  });

  const corsOptions = {
    origin: function (origin, callback) {
      if ([...WHITE_LIST, undefined].includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed"));
      }
    },
  };

  app.use(cors(corsOptions), helmet(), limiter, express.json());

  app.get("/", (req, res, next) => {
    successResponce({ res, message: "Welcome on my app" });
  });

  checkConnectionDB();
  reddisConnection();

  app.use("/users", userRouter);
  app.use("/messages", messageRouter);

  app.use("{/*demo}", (req, res, next) => {
    throw new Error(`Url ${req.originalUrl} Not Found`, { cause: 404 });
  });

  app.use((err, req, res, next) => {
    res
      .status(err.cause || 500)
      .json({ message: err.message, stack: err.stack });
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

export default bootstrap;
