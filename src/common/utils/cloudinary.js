import { v2 as cloudinary } from "cloudinary";
import { API_SECRET } from "../../../config/config.service.js";

cloudinary.config({
  cloud_name: "dzxgpgrv3",
  api_key: "932388157976344",
  api_secret: API_SECRET,
});

export default cloudinary;
