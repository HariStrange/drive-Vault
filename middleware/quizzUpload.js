const multer = require("multer");
const path = require("path");
const fs = require("fs");

const quizDir = path.join(__dirname, "");

// ensure directory exists
if (!fs.existsSync(quizDir)) {
  fs.mkdirSync(quizDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, quizDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (.jpeg, .jpg, .png, .webp)"));
    }
  },
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

module.exports = upload;
