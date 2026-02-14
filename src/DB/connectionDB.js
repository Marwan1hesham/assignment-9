import mongoose from "mongoose";

const checkConnectionDB = () => {
  mongoose
    .connect("mongodb://localhost:27017/sarahaApp")
    .then(() => {
      console.log("Connected to the database successfully");
    })
    .catch((error) => {
      console.log("Failed to connect to the database", error);
    });
};

export default checkConnectionDB
