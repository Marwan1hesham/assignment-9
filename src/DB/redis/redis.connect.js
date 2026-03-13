import { createClient } from "redis";
import { REDIS_URL } from "../../../config/config.service.js";

export const redis_client = createClient({
  url: REDIS_URL,
});

export const reddisConnection = async () => {
  await redis_client
    .connect()
    .then(() => {
      console.log("Connected to redis successfully");
    })
    .catch((error) => {
      console.log("Failed to connect to redis", error);
    });
};
