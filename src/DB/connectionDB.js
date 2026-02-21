import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";

const checkConnectionDB = () => {
  mongoose
    .connect(DB_URI)
    .then(() => {
      console.log("Connected to the database successfully");
    })
    .catch((error) => {
      console.log("Failed to connect to the database", error);
    });
};

export default checkConnectionDB
