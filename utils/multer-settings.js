const multer = require("multer");
const path = require("path");
const constants = require("./constants");
/** code to configure user upload profile image starts */
const userUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.USER_IMAGE);

let userImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, userUploadDirPath);
  },
  filename: function (req, file, cb) {
    let exploded_name = file.originalname.split(".");
    let ext = exploded_name[exploded_name.length - 1];
    cb(null, Date.now() + "." + ext);
  }
});

let uploadUserImageConfig = multer({
  storage: userImageStorage,
  limits: {
    fileSize: 15000000 // 5MB
  },
  fileFilter: function (req, file, cb) {
    return cb(null, true);
  }
}).fields([
  { name: "avatarurl", maxCount: 1 },
  { name: "logourl", maxCount: 1 }
]);

const CarImagesUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.CARS_IMAGES);

let CarsImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, CarImagesUploadDirPath);
  },
  filename: function (req, file, cb) {
    let exploded_name = file.originalname.split(".");
    let ext = exploded_name[exploded_name.length - 1];
    cb(null, Date.now() + "." + ext);
  }
});

let uploadCarsImageConfig = multer({
  storage: CarsImageStorage,
  limits: {
    fileSize: 15000000 // 5MB
  },
  fileFilter: function (req, file, cb) {
    return cb(null, true);
  }
}).fields([
  { name: "images", maxCount: 50 },
  { name: "featured_image", maxCount: 1 }
]);

const BlogImagesUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.BLOG_IMAGES);

let BlogImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, BlogImagesUploadDirPath);
  },
  filename: function (req, file, cb) {
    let exploded_name = file.originalname.split(".");
    let ext = exploded_name[exploded_name.length - 1];
    cb(null, Date.now() + "." + ext);
  }
});

let uploadBlogImageConfig = multer({
  storage: BlogImageStorage,
  limits: {
    fileSize: 15000000 // 5MB
  },
  fileFilter: function (req, file, cb) {
    return cb(null, true);
  }
}).fields([
  { name: "image", maxCount: 1 },
]);


const TestImagesUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.TEST_FOLDER);

let TestImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TestImagesUploadDirPath);
  },
  filename: function (req, file, cb) {
    let exploded_name = file.originalname.split(".");
    let ext = exploded_name[exploded_name.length - 1];
    cb(null, Date.now() + "." + ext);
  }
});

let uploadTestImageConfig = multer({
  storage: TestImageStorage,
  limits: {
    fileSize: 15000000 // 5MB
  },
  fileFilter: function (req, file, cb) {
    return cb(null, true);
  }
}).fields([
  { name: "images", maxCount: 50 },
]);


module.exports = {
  uploadUserImageConfig: uploadUserImageConfig,
  uploadCarsImageConfig:uploadCarsImageConfig,
  uploadBlogImageConfig:uploadBlogImageConfig,
  uploadTestImageConfig:uploadTestImageConfig
};