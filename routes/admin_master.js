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
const bcrypt  = require('bcrypt-nodejs');
const path = require("path");
const moment     = require('moment');
const uploadUserImageConfig = multerSettings.uploadUserImageConfig;
const EmailController = require("../controllers/email");
const CarsController = require("../controllers/cars");

router.post("/create-admin", function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false}; 
    let postData = req.body;
    postData.email = postData.email.toLowerCase();
      let checkEmailExists = await AdminController.checkEmailExists(postData.email);
      if(checkEmailExists){
        response.success = false;
        response.errorCode = customErrors.ERROR_CODES.DATABASE_ERROR.EMAIL_EXISTS.CODE;
        response.msg = customErrors.ERROR_CODES.DATABASE_ERROR.EMAIL_EXISTS.MESSAGE;
      }else{
        let checkUserNameExists = await AdminController.checkUserNameExists(postData.username);
        if (checkUserNameExists) {
          response.success = false;
          response.msg = 'Username already exist';
        }else{
          let isAdminAdded = await AdminController.createNewAdmin(postData);
          let signValues = { id: isAdminAdded._id };
          let token = await utils.signToken(signValues);
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
          response.data = {adminDetails:isAdminAdded,token:token};
        }
      }
    return res.status(200).send(response);
  });
});

router.post("/login", function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let userFound = await AdminController.findAdminByEmailOrUsername(postData.email);
    if(userFound){
      //let isPasswordValid = utils.matchPassword(postData.password,userFound.password);
      let isPasswordValid  = await bcrypt.compareSync(postData.password,userFound.admin.password);
      if(isPasswordValid){
        let signValues = { id: userFound._id };
        let token = await utils.signToken(signValues);
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.data = {userDetails:userFound,token:token};
      }else{
        response.success = false;
        response.errorCode = customErrors.ERROR_CODES.DATABASE_ERROR.INVALID_PASSWORD.CODE;
        response.msg = customErrors.ERROR_CODES.DATABASE_ERROR.INVALID_PASSWORD.MESSAGE;
      }
    }else{
      response.success = false;
      response.errorCode = customErrors.ERROR_CODES.DATABASE_ERROR.INVALID_EMAIL_OR_USERNAME.CODE;
      response.msg = customErrors.ERROR_CODES.DATABASE_ERROR.INVALID_EMAIL_OR_USERNAME.MESSAGE;
    }
    return res.status(200).send(response); 

  });
});

router.get("/get-admin-details",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false}; 
      if(req.user && req.user != ''){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.data = req.user;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
    return res.status(200).send(response);
  });
});

  router.post("/update-admin-profile",[authetication.authenticate_admin], function (req, res, next) {
    return Bluebird.try(async() => {
      let response = {};
      let adminID = req.user._id;
      let postData = req.body;
      let checkEmailExists = "";
      if(postData.email && postData.email != ''){
        postData.email = postData.email.toLowerCase();
        checkEmailExists = await AdminController.checkAdminEmailExists(adminID,postData.email);
      }else{
       checkEmailExists = false; 
      }
      if(checkEmailExists){
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.EMAIL_EXIST;
      }else{
        let updateAdminProfile = await AdminController.updateAdminProfile(adminID,postData);
        if (updateAdminProfile) {
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
          response.data = updateAdminProfile;
        }else{
          response.success = false;
          response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
        }
      }
      return res.status(200).send(response);
    });
  });

  router.post("/change-admin-password",[authetication.authenticate_admin], function (req, res, next) {
    return Bluebird.try(async() => {
      //console.log("==============");
      let old_password = "";
      let new_password = "";
      let confirm_password = "";
      let reason = "";
      if(req.body.old_password){
        old_password = req.body.old_password;
      }
      if(req.body.new_password){
        new_password = req.body.new_password;
      }
      if(req.body.confirm_password){
        confirm_password = req.body.confirm_password;
      }

      var salt = await  bcrypt.genSaltSync(10);
     // old_password = await bcrypt.hashSync(old_password, salt);

      let isPasswordValid  = await bcrypt.compareSync(old_password,req.user.admin.password);

        if(isPasswordValid){
        if((new_password == confirm_password) && (new_password != "")){
  
          new_password = await bcrypt.hashSync(new_password, salt);

          let updateData = {};
          updateData.admin = {
            password : new_password
          };
          updateData.local = {
            password : new_password
          }

          return AdminController.updateAdminDetails(req.user._id,updateData)
          .then((isUpdated)=>{
            reason = constants.APP_LANGUAGE_CONSTANTS.en.PASSWORD_CHANGES_SUCCESSFULLY;
            return res.status(200).send({success:true,msg:reason});  
          })
        }else{
          if(new_password == ""){
            reason = constants.APP_LANGUAGE_CONSTANTS.en.NEW_PASSWORD_SHOULD_NOT_BE_BLANK;   
          }else{
            reason = constants.APP_LANGUAGE_CONSTANTS.en.PASSWORD_AND_CONFIRM_PASSWORD_SHOULD_MATCH;
          }
          return res.status(200).send({success:false,msg:reason});  
        }
      }else{
        reason = constants.APP_LANGUAGE_CONSTANTS.en.PLEASE_ENTER_CORRECT_OLD_PASSWORD;
        return res.status(200).send({success:false,msg:reason});
      }
    });
  });

router.post("/get-users-list",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body; 
      let getUsersList = await AdminController.getUsersList(postData);
      let checkList =  getUsersList.list;
      if(checkList.length>0){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.totalCount = getUsersList.totalCount;
        response.data = getUsersList.list;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
    return res.status(200).send(response);
  });
});

router.post("/get-technician-list",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body; 
      let getTechniciansList = await AdminController.getTechniciansList(postData);
      let checkList =  getTechniciansList.list;
      if(checkList.length>0){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.totalCount = getTechniciansList.totalCount;
        response.data = getTechniciansList.list;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
    return res.status(200).send(response);
  });
});

router.get("/get-single-user-data/:user_id",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false}; 
      let user_id = req.params.user_id;
      let getSingleUser = await usersController.findUserById(user_id);
      if(getSingleUser){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.data = getSingleUser;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
    return res.status(200).send(response);
  });
});

router.delete("/delete-single-user/:user_id",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false}; 
      let user_id = req.params.user_id;
      let getUserData = await usersController.findUserById(user_id);
      if (getUserData.avatar_image_name) {
          let userUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.USER_IMAGE);
          let imagePath =  userUploadDirPath+"/"+getUserData.avatar_image_name;
          commonFunctionController.unlinkImage(imagePath)
      }if (getUserData.logo_image_name && getUserData.logo_image_name != '') {
          let userUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.USER_IMAGE);
          let imagePath =  userUploadDirPath+"/"+getUserData.logo_image_name;
          commonFunctionController.unlinkImage(imagePath);
      }
      let deleteSingleUser = await AdminController.deleteSingleUser(user_id);
      if(deleteSingleUser){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.USER_DELETED;
      }else{
        response.success = false;
        response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
      }
    return res.status(200).send(response);
  });
});

router.put("/update-user-details", [authetication.authenticate_admin],function (req, res, next) {
  return Bluebird.try(async() => {
    let upload = Bluebird.promisify(uploadUserImageConfig);
    return upload(req, res).then(async(uploadData) => {
      let response = {};
      let postData = req.body;
      let user_id = postData.user_id;
      delete postData.user_id;
      let getSingleUser = await usersController.findUserById(user_id);
      if(req.files && (req.files.avatarurl)){
        postData.avatarurl = process.env.SITE_URL+"user-images/"+req.files.avatarurl[0].filename;
        postData.avatar_image_name = req.files.avatarurl[0].filename;
      }
      if(req.files && (req.files.logourl)){
        postData.logourl = process.env.SITE_URL+"user-images/"+req.files.logourl[0].filename;
        postData.logo_image_name = req.files.logourl[0].filename;
      }
      if(postData.email && postData.email != ''){
        postData.email = postData.email.toLowerCase();
        let checkEmailExists = await usersController.checkEmailExistsForUpdateUser(user_id,postData.email);
        if(checkEmailExists){
          response.success = false;
          response.msg = customErrors.ERROR_CODES.DATABASE_ERROR.EMAIL_EXISTS.MESSAGE;
          return res.status(200).send(response);
        }
      }
      let updatedDetails = await usersController.updatedDetails(user_id,postData);
      if (updatedDetails) {
        if (getSingleUser.avatar_image_name && getSingleUser.avatar_image_name != '') {
          let userUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.USER_IMAGE);
          let imagePath =  userUploadDirPath+"/"+getSingleUser.avatar_image_name;
          commonFunctionController.unlinkImage(imagePath);
        }
        if (getSingleUser.logo_image_name && getSingleUser.logo_image_name != '') {
          let userUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.USER_IMAGE);
          let imagePath =  userUploadDirPath+"/"+getSingleUser.logo_image_name;
          commonFunctionController.unlinkImage(imagePath);
        }
        response.success = true;
        response.data = updatedDetails;
        response.msg = constants.COMMON_MESSAGES.USER_DETAILS_UPDATED;
      }else{
        response.success = false;
        response.msg = customErrors.ERROR_CODES.UNKNOWN_ERROR.MESSAGE;
      }
      return res.status(200).send(response);
    });
  });
});


router.post("/add-subscription",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    postData.creator = req.user._id;
    let response = {success:false}; 
      let addSubscription = await AdminController.addSubscription(postData);
      if(addSubscription){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.ADD_SUBSCRIPTION;
        response.data = addSubscription;
      }else{
        response.success = false;
        response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
      }
    return res.status(200).send(response);
  });
});

router.put("/update-subscription",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let sub_id = postData.sub_id;
    delete postData.sub_id;
      let updateSubscription = await AdminController.updateSubscription(postData,sub_id);
      if(updateSubscription){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_UPDATED;
        response.data = updateSubscription;
      }else{
        response.success = false;
        response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
      }
    return res.status(200).send(response);
  });
});

router.get("/get-single-subscription-details/:sub_id",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let sub_id = req.params.sub_id;
      let getSingleSubscriptionData = await AdminController.getSingleSubscriptionData(sub_id);
      if(getSingleSubscriptionData){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.data = getSingleSubscriptionData;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
    return res.status(200).send(response);
  });
});

router.get("/get-subscription-list", function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
      let SubscriptionList = await AdminController.getSubscriptionList();
      if(SubscriptionList.length>0){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.data = SubscriptionList;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
    return res.status(200).send(response);
  });
});

router.delete("/delete-subscription/:sub_id",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let sub_id = req.params.sub_id;
    let deleteSubscription = await AdminController.deleteSubscription(sub_id);
    if(deleteSubscription){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_DELETED;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});


router.post("/add-car",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    postData.creator = req.user._id;
    let response = {success:false}; 
      let addCar = await AdminController.addCar(postData);
      if(addCar){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.ADD_CAR;
        response.data = addCar;
      }else{
        response.success = false;
        response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
      }
    return res.status(200).send(response);
  });
});

router.post("/add-make",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let data = {
      creator   : req.user._id,
      maketitle : req.body.maketitle,
      models    : [],
      status    : 'active',
      date      : moment().format('YYYY-MM-DD')
    };
    let addMake = await AdminController.addMake(data);
    if(addMake){
      response.success = true;
      response.msg = 'Successfull added make';
      response.data = addMake;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});

router.post("/add-make-models",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false}; 
    let query  = { maketitle : req.body.modelmake };
    let update = { $push: {
      models : {
          creator    : req.user._id,
          modeltitle : req.body.model,
          status     : 'active',
          date       : moment().format('YYYY-MM-DD')
      }
    } };
    let addMAkeModel = await AdminController.addMAkeModel(query,update);
    if(addMAkeModel){
      response.success = true;
      response.msg = 'Successfully added make model';
      response.data = addMAkeModel;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});

router.post("/add-year",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    if(req.body.year && req.body.year != ''){
      let data = {
        creator : req.user._id,
        year    : req.body.year,
        status  : 'active',
        date    : moment().format('YYYY-MM-DD')
      };
      let addYear = await AdminController.addYear(data);
      if(addYear){
        response.success = true;
        response.msg = 'Successfully added year';
        response.data = addYear;
      }else{
        response.success = false;
        response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
     }
    }else{
      response.success = false;
      response.msg = 'Year required';
    } 
    return res.status(200).send(response);
  });
});

router.get("/get-all-years", function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
      let getAllYears = await AdminController.getAllYears();
      if(getAllYears.length>0){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.data = getAllYears;
      }else{
        response.success = false;
        response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
     }
    return res.status(200).send(response);
  });
});

router.post("/get-rating-review-list",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let getRatingAndReviewList = await AdminController.getRatingAndReviewList(postData);
    let checkList = getRatingAndReviewList.list;
    if(checkList.length>0){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.totalCount = getRatingAndReviewList.totalCount;
      response.data = getRatingAndReviewList.list;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

router.post("/renew/subscriptions",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;

    let planid      = req.body.planid;
    let duration    = parseInt(req.body.duration);
    let userid      = req.body.userid;

    let startDate   = moment();
    let expiryDate  = await commonFunctionController.addRealMonth(startDate, duration);

    let startCDate  = startDate.format('YYYY-MM-DD');
    let expiryCDate = expiryDate.format('YYYY-MM-DD');

    let startTimes  = startDate.format("X");
    let expiryTimes = expiryDate.format("X");

    let sub = await usersController.getSubscriptionById(planid);

    console.log("sub : ",sub);

    let user = await usersController.findUserById(userid);

    let history    = user.subscriptions[0];
    
    history.status = 'expired';
    history.type   = 'expired';

    let update = await AdminController.createQueryForSubsciption(sub,duration,startCDate,expiryCDate,startTimes,expiryTimes,history);
    
    let updateUser = await usersController.updateUser(userid, update);
    if(updateUser){
      response.success = true;
      response.msg = 'Package renewed successfully';
      response.data = updateUser;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
   }

    return res.status(200).send(response);
  });
});

router.post('/update/subscriptions',[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let action     = req.body.action;
    let userid     = req.body.userid;
    let startDate  = moment();
    let startCDate = startDate.format('YYYY-MM-DD');
    let startTimes = startDate.format("X");

    let user = await usersController.findUserById(userid);

    let history = user.subscriptions, update;

    if (action == 'canceled') {
      history.status = action;
      update         = { $set: {
        'subscriptions.0.amount'      : 0,
        'subscriptions.0.expirycdate' : startCDate,
        'subscriptions.0.expirytimes' : startTimes,
        'subscriptions.0.status'      : action,
        'subscriptions.0.type'        : action
      }, $push : { histories : history } };
    } else {
      
      if (history.status == 'canceled') {
        update = { $set: { 'subscriptions.0.status' : history.status, 'subscriptions.0.type' : history.status } };
      } else {
        update = { $set: { 'subscriptions.0.status' : action } };
      }
    }
    console.log("update : ",update);
    let updateUser = await usersController.updateUser(userid, update);

    if(updateUser){
      response.success = true;
      response.msg = 'Subscription update successfully';
      response.data = updateUser;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }

    return res.status(200).send(response);
         
  });
});

router.post('/commit/order', [authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let orderid = req.body.orderid;

    let order = await usersController.GetOrderDetails(orderid);

    let userid      = order.creator;
    let subname     = order.sub.subname;
    let subtitle    = order.sub.title || 'Untitled';
    let amount      = order.sub.amount;
    let duration    = parseInt(order.sub.duration);
    let price       = order.sub.price;

    let startDate   = moment();
    let expiryDate  = await commonFunctionController.addRealMonth(startDate, duration);

    let startCDate  = startDate.format('YYYY-MM-DD');
    let expiryCDate = expiryDate.format('YYYY-MM-DD');

    let startTimes  = startDate.format("X");
    let expiryTimes = expiryDate.format("X");

    let user = await usersController.findUserById(userid);

    let history    = user.subscriptions[0];

    history.status = 'renewed';
    history.type   = 'renewed';
    let update     = { $set: {
        'subscriptions.0.name'        : subname,
        'subscriptions.0.title'       : subtitle,
        'subscriptions.0.amount'      : (amount*parseInt(duration))+history.amount,
        'subscriptions.0.price '      : price*parseInt(duration),
        'subscriptions.0.duration'    : parseInt(duration),
        'subscriptions.0.startcdate'  : startCDate,
        'subscriptions.0.expirycdate' : expiryCDate,
        'subscriptions.0.starttimes'  : startTimes,
        'subscriptions.0.expirytimes' : expiryTimes,
        'subscriptions.0.status'      : 'active',
        'subscriptions.0.type'        : 'paid'
    }, $push : { histories : history } };

    let updateUser = await usersController.updateUser(userid, update);

    if (updateUser) {
      let updateOrder = await usersController.updateOrder(orderid, { $set: { status : 'completed'}});
      if (updateOrder) {
        //HomeModel.updateOrder(orderid, { $set: { status : 'completed'}}, rs => {
        let mailOptions = {
            from: constants.SITE_EMAIL_ADDRESS, // sender address
            //to: user.email,    // list of receivers , aliyuaminu14@gmail.com
            to: 'akshay.devstree@gmail.com',
            subject: 'Your Chat2Cars order from '+startCDate+' is complete', // Subject line
            html: 'Hi '+user.fullname+',<br><br> Your recent order on Chat2Cars is completed. Check your profile to see an update, <br><br>Thank you.' // html body
        };

        let sendSUbscriptionMail = await EmailController.defaultMailSend(mailOptions);

        updateOrder = await usersController.GetOrderDetails(orderid);

        response.success = true;
        response.msg = 'Subscription update successfully';
        response.data = updateOrder;
      }else{
        response.success = false;
        response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
      }
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});



  router.post('/update/ad/status', [authetication.authenticate_admin], function (req, res, next) {
    return Bluebird.try(async() => {
      let postData = req.body;
      let response = {success:false};
      let action = req.body.action;
      let adid   = req.body.adid;
      let update = { status : action };

      let updateAd = await CarsController.updateCarDetails(update,adid);
      if (updateAd) {
          response.success = true;
          response.msg = 'Data update successfully';
          response.data = updateAd;
      }else{
        response.success = false;
        response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
      }
      
      return res.status(200).send(response);
    });
  });


router.post('/update/ad/featured', [authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let action     = req.body.action;
    let featured   = req.body.featured;
    let adid       = req.body.adid, update;

    if (action == 'active') {
        update = { $set:{ featured : true} };
    } else {
        update = { $unset:{ featured : false} };
    }
    
    let updateAd = await CarsController.updateAd(orderid, update);
    if (updateAd) {
        response.success = true;
        response.msg = 'Data update successfully';
        response.data = updateAd;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
      return res.status(200).send(response);
    });
  });

  
  router.post("/cars/get-car-list",[authetication.authenticate_admin], function (req, res, next) {
    return Bluebird.try(async() => {
      let postData = req.body;
      let response = {success:false};
      postData.subscribers = [];
      let getSubscribers = await usersController.getAllUsers(postData);
      getSubscribers.forEach(subscriber => {
        postData.subscribers.push(subscriber._id);
      });
      let getCarList = await AdminController.getCarList(postData);
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

  router.get('/dashboard/get-dashboard-count', [authetication.authenticate_admin], function (req, res, next) {
    return Bluebird.try(async() => {
      let postData = req.body;
      let response = {success:false};
      let dashboardCount = await AdminController.dashboardCount();
      if (dashboardCount) {
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
          response.data = dashboardCount;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
        return res.status(200).send(response);
      });
    });


    router.post('/add-car-type', [authetication.authenticate_admin], function (req, res, next) {
      return Bluebird.try(async() => {
        let postData = req.body;
        let response = {success:false};
        postData.creator = req.user._id;
        let addCarType = await CarsController.addCarType(postData);
        if (addCarType) {
            response.success = true;
            response.msg = 'Data Added successfully';
            response.data = addCarType;
        }else{
          response.success = false;
          response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
        }
        return res.status(200).send(response);
      });
    });

module.exports = router;