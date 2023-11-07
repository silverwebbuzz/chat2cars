"use strict";

const router = require("express-promise-router")();
const Bluebird = require("bluebird");
const validations = require("../utils/validations");
const AdminController = require("../controllers/admin_master");
const usersController = require("../controllers/users");
const utils = require("../utils/utils");
const constants = require("../utils/constants");
const customErrors = require("../utils/errors");
const multerSettings = require("../utils/multer-settings");
const authetication = require("../middleware/authentication");
const commonFunctionController = require("../controllers/common_functions");
const carsController = require("../controllers/cars");
const path = require("path");

const uploadCarsImageConfig = multerSettings.uploadCarsImageConfig;
const uploadTestImageConfig = multerSettings.uploadTestImageConfig;

const moment = require('moment');
const EmailController = require("../controllers/email");
// const tinify = require("tinify");
// tinify.key = "Lx4L1FDg68GZnJ1bCm22DHyxXgSj3rZf";
const im = require('imagemagick');

router.post("/add-car",[authetication.authenticate_common], function (req, res, next) {
  return Bluebird.try(async() => {
    let upload = Bluebird.promisify(uploadCarsImageConfig);
    return upload(req, res).then(async(data) => {
      let response = {success:false};
      let startTimes = moment().format("X");
      if (req.user.subscriptions[0].amount > 0 && req.user.subscriptions[0].expirytimes > startTimes) {
        let postData = req.body;
        postData.creator = req.user._id;
        postData.title = postData.title.replace("/", "-");
        let slug = postData.title.toLowerCase()+'-'+Date.now(); 
        slug = slug.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        postData.slug = slug.replace(new RegExp(' ', 'g'), '-');
        postData.date = moment().format('YYYY-MM-DD');
        postData.status = 'active';
        if (req.files && req.files.featured_image && req.files.featured_image[0] && req.files.featured_image[0] != '') {
          postData.featured_image =  req.files.featured_image[0].filename;
          let featured_image = req.files.featured_image;
          let ModifyFeaturedImage = await carsController.compressFeaturedImage(featured_image);
        }else{
          postData.featured_image = "";
        }
        if (req.files && req.files.images && req.files.images[0] &&  req.files.images != "") {
          let carsImages = req.files.images;
          postData.images = [];
          if (carsImages.length > 0) {
            let ModifyImagesData = await carsController.ModifyImagesData(carsImages);
            postData.images = ModifyImagesData;
          }
        }
        if ( postData.carfeatures && postData.carfeatures != "") { 
          let carfeatures = postData.carfeatures;
          postData.carfeatures = carfeatures.split(',');
        };
        let addCar = await carsController.addCar(postData);
        if(addCar){
          let updateSubAmount = await usersController.updateSubAmount(req.user._id);
          if (updateSubAmount.subscriptions[0].amount <= 4) {
            let mailOptions = {
              from: constants.SITE_EMAIL_ADDRESS, // sender address
              to: req.user.email, // list of receivers , aliyuaminu14@gmail.com
              subject: 'Chat2Cars - Reminder', // Subject line
              html: 'Hi '+req.user.fullname+',<br><br>Your subscription is about end you have '+updateSubAmount.subscriptions[0].amount+' Left, Please renew subscription.<br><br>to renew you subscription click on https://chat2cars.ng/subscriptions<br><br>Thank you.' // html body
            };
            let sendExpiryMail = await EmailController.defaultMailSend(mailOptions);
          }
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.ADD_CAR;
          response.data = addCar;
        }else{
          response.success = false;
          response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
        }
      } else {
        let mailOptions = {
            from: constants.SITE_EMAIL_ADDRESS, // sender address
            to: req.user.email, // list of receivers , aliyuaminu14@gmail.com
            subject: 'Chat2Cars - Reminder', // Subject line
            html: 'Hi '+req.user.fullname+',<br><br>You don\'t have subscription left, Please renew subscription.   <br><br>Thank you.' // html body
        };
        let sendExpiryMail = await EmailController.defaultMailSend(mailOptions);
        response.success = false;
        response.msg = "Oops! Sorry! You don't have subscription left.";
      }
      return res.status(200).send(response);
    });
  });
});


router.post("/test-image", function (req, res, next) {
  return Bluebird.try(async() => {
    let upload = Bluebird.promisify(uploadTestImageConfig);
    return upload(req, res).then(async(data) => {
      let carsImages = req.files.images;
      let compressedImages = await commonFunctionController.compressCarsImages(carsImages);
    return res.status(200).send(compressedImages);
    });
  });
});

router.post("/get-car-list",[authetication.not_required_authentication],function (req, res, next) {
  return Bluebird.try(async() => {
    
    let postData = req.body;
    let response = {success:false};
    postData.subscribers = [];
    let getSubscribers = await usersController.getAllActiveUsers(postData);
    getSubscribers.forEach(subscriber => {
      postData.subscribers.push(subscriber._id);
    });
    let getCarList = await carsController.getCarList(postData,req.user);
    let checkList = getCarList.list;
    if(checkList.length>0){
      let count_records = await getCarList.length;
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.count_records = getCarList.totalCount;
      response.data = getCarList.list; 
    }else{
      let count_records = await getCarList.length;
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      response.count_records = getCarList.totalCount;
      response.data = getCarList.list; 
    }
    return res.status(200).send(response);
  });
});

router.get("/get-single-car/:car_slug", function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let car_slug = req.params.car_slug;
    let getSingleCarData = await carsController.getSingleCarDataBySlug(car_slug);
    if(getSingleCarData){
      let getRecentAds = await carsController.getRecentAds();
      let updateData = {};
      updateData.clicks = getSingleCarData.clicks+1;
      let updateClickForCar = await carsController.updateCarDetails(updateData,getSingleCarData._id);
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.data = getSingleCarData;
      response.recent_list = getRecentAds;
      
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

router.get("/groupByQuery", function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let groupByQuery = await carsController.groupByQuery();
    if(groupByQuery.length>0){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.data = groupByQuery;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

router.delete("/delete-car/:car_id",[authetication.authenticate_common], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let car_id = req.params.car_id;
    let deleteCar = await carsController.deleteCar(car_id);
    if(deleteCar){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_DELETED;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});

router.post("/update-car-details",[authetication.authenticate_common], function (req, res, next) {
  return Bluebird.try(async() => {
    let upload = Bluebird.promisify(uploadCarsImageConfig);
    return upload(req, res).then(async(data) => {
      let postData = req.body;
      let car_id = postData.car_id;
      delete postData.car_id;
      let response = {success:false};
      let getFeaturedCarImage = await carsController.getFeaturedCarImage(car_id);
      if (req.files && req.files.featured_image && req.files.featured_image[0] && req.files.featured_image[0] != '') {
        postData.featured_image =  req.files.featured_image[0].filename;  
        let featured_image = req.files.featured_image;
        let ModifyFeaturedImage = await carsController.compressFeaturedImage(featured_image);
      }
      if (req.files && req.files.images && req.files.images[0] &&  req.files.images != '') {
        let carsImages = req.files.images;
        if (carsImages.length > 0) {
          let ModifyImagesData = await carsController.ModifyImagesData(carsImages);
          let pushCarImages = await carsController.pushCarImages(ModifyImagesData,car_id);
        }
      }
      if ( postData.carfeatures && postData.carfeatures != '' ) { 
        let carfeatures = postData.carfeatures;
        postData.carfeatures = carfeatures.split(',');
      };

      let updateCarData = await carsController.updateCarDetails(postData,car_id);
      if(updateCarData){

        if (getFeaturedCarImage && getFeaturedCarImage.featured_image && getFeaturedCarImage.featured_image != '' && getFeaturedCarImage.featured_image != constants.PLACE_HOLDER_IMAGES.CARS_PLACEHOLDER && req.files.featured_image && req.files.featured_image[0] && req.files.featured_image[0] != '') {
          let userUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.CARS_IMAGES);
          let imagePath =  userUploadDirPath+"/"+getFeaturedCarImage.featured_image;
          commonFunctionController.unlinkImage(imagePath);
        }
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_UPDATED;
        response.data = updateCarData;
      }else{
        response.success = false;
        response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
      }
      return res.status(200).send(response);
    });
  });
});

router.delete("/delete-car-single-image",[authetication.authenticate_common], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let deleteCarImage = await carsController.deleteImageFromArray(postData);
    if(deleteCarImage){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_DELETED;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});

router.post("/like-dislike-car",[authetication.authenticate_common], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let userId = req.user._id;
    if (postData.car_id && postData.car_id != '') {
      let carId = postData.car_id;
      let LikeCar = await carsController.LikeDislikeCars(carId,userId);
      if(LikeCar){
        let getSingleCarData = await carsController.getSingleCarData(carId);
        getSingleCarData.is_favorite = LikeCar.is_favorite;
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_UPDATED;
        response.data = getSingleCarData;
      }else{
        response.success = false;
        response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
      }
    }else{
      response.success = false;
      response.msg = "Empty Car Id";
    }
    return res.status(200).send(response);
  });
});

router.post("/get-favorite-list",[authetication.authenticate_common], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let getFavoriteList = await carsController.getFavoriteList(req.user,postData);
    let checkList = getFavoriteList.list;
    if(checkList.length>0){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.count_records = getFavoriteList.totalCount;
      response.data = getFavoriteList.list; 
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

router.post("/test-drive/book-test-drive",[authetication.not_required_authentication], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    if (req.user) {
      postData.creator = req.user._id;
    }else{
      postData.creator = '';
    }
    let bookTestDrive = await carsController.bookTestDrive(postData);
    if(bookTestDrive){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.BOOK_TEST_DRIVE;
      response.data = bookTestDrive;
      let mailOptions = {
        from: constants.SITE_EMAIL_ADDRESS, // sender address
        to: constants.SITE_EMAIL_ADDRESS, // list of receivers , aliyuaminu14@gmail.com
        //to: 'akshay.devstree@gmail.com',
        subject: 'Chat2Cars - '+bookTestDrive.fullname+' Has Booked A Test Drive', // Subject line
        html: 'Name : '+bookTestDrive.fullname+'<br><br>Mobile Number : '+bookTestDrive.mobile_number+'<br><br>Email : '+bookTestDrive.email+
        '<br><br>State : '+bookTestDrive.state+
        '<br><br>city : '+bookTestDrive.city+
        '<br><br>postcode : '+bookTestDrive.postcode+
        '<br><br>Make : '+bookTestDrive.car_brand+
        '<br><br>Model : '+bookTestDrive.car_model+
        '<br><br><br><br>Thanks & Regards'+
        '<br>Chat2cars ' // html body
      };
      let sendExpiryMail = await EmailController.defaultMailSend(mailOptions);
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});

router.post("/test-drive/list-booked-test-drives",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let getTestDriveList = await carsController.getTestDriveList(postData);
    let checkList = getTestDriveList.list;
    if(checkList.length>0){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.totalCount = getTestDriveList.totalCount;
      response.data = getTestDriveList.list;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

router.get("/test-drive/get-test-drive-details/:id",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let testDriveId = req.params.id;
    let getSingleTestDriveDetails = await carsController.getSingleTestDriveDetails(testDriveId);
    if(getSingleTestDriveDetails){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.data = getSingleTestDriveDetails;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

router.put("/test-drive/update-test-drive-details",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let updateTestDriveDetails = await carsController.updateTestDriveDetails(postData);
    if(updateTestDriveDetails){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_UPDATED;
      response.data = updateTestDriveDetails;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});

router.delete("/test-drive/delete-single-record-by-id/:record_id",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let record_id = req.params.record_id;
    let deleteTestDriveRecord = await carsController.deleteTestDriveRecord(record_id);
    if(deleteTestDriveRecord){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_DELETED;
      response.data = deleteTestDriveRecord;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});

router.get("/update-cars-images", function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let updateCarImages = await carsController.updateCarImages();
    if(updateCarImages.length>0){
      response.success = true;
      response.msg = 'Data Updated Successfull';
      //response.data = updateCarImages;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

module.exports = router;