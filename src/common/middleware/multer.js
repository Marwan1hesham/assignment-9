import multer from "multer";
import fs from "node:fs";

export const multer_local = ({
  custom_path = "General",
  custom_types = [],
} = {}) => {
  const fullPath = `uploads/${custom_path}`;
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath);
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, fullPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix);
    },
  });

  function fileFilter(req, file, cb) {
    if (!custom_types.includes(file.mimetype)) {
      cb(new Error("Invalid file type"));
    }
    cb(null, true);
  }

  return multer({ storage, fileFilter });
};

export const multer_host = (custom_types = []) => {
  const storage = multer.diskStorage({});

  function fileFilter(req, file, cb) {
    if (!custom_types.includes(file.mimetype)) {
      cb(new Error("Invalid file type"));
    }
    cb(null, true);
  }

  return multer({ storage, fileFilter });
};
