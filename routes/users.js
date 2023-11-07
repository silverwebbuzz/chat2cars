"use strict";

const router = require("express-promise-router")();
const Bluebird = require("bluebird");
const validations = require("../utils/validations");
const utils = require("../utils/utils");
const constants = require("../utils/constants");
const customErrors = require("../utils/errors");
const multerSettings = require("../utils/multer-settings");
const authetication = require("../middleware/authentication");
const UsersController = require("../controllers/users");
const CarsController = require("../controllers/cars");
const commonFunctionController = require("../controllers/common_functions");
const EmailController = require("../controllers/email");
const path = require("path");
const moment     = require('moment');
const bcrypt  = require('bcrypt-nodejs');
const fs = require("fs");
const im = require('imagemagick');

let uploadUserImageConfig = multerSettings.uploadUserImageConfig;

router.post("/sign-up", function (req, res, next) {
  return Bluebird.try(async() => {
    let upload = Bluebird.promisify(uploadUserImageConfig);
    return upload(req, res).then(async(data) => {
      let response = {success:false}; 
      let postData = req.body;
      postData.email = postData.email.toLowerCase();
      let checkEmailExists = await UsersController.checkUserEmailExists(postData.email);
      if(checkEmailExists){
        response.success = false;
        response.msg = customErrors.ERROR_CODES.DATABASE_ERROR.EMAIL_EXISTS.MESSAGE;
      }else{
        if(req.files && (req.files.avatarurl)){
          postData.avatarurl = req.files.avatarurl[0].filename;
        }
        else{
          postData.avatarurl = constants.PLACE_HOLDER_IMAGES.USER_PLACEHOLDER;
        }
        if(req.files && (req.files.logourl)){
          postData.logourl = req.files.logourl[0].filename;
        }
        else{
          postData.logourl = constants.PLACE_HOLDER_IMAGES.DEFAUT_PLACEHOLDER;
        }

        let startDate   = moment();
        let expiryDate  = await commonFunctionController.addRealMonth(startDate, 1);

        let startCDate  = await startDate.format('YYYY-MM-DD');
        let expiryCDate = await expiryDate.format('YYYY-MM-DD');

        let startTimes  = await startDate.format("X");
        let expiryTimes = await expiryDate.format("X");
        let freeSub = await UsersController.getFreeSubscription();
        postData.subscriptions = {
          name        : freeSub.name, 
          title       : freeSub.title, 
          amount      : freeSub.number, 
          price       : parseInt(freeSub.price), 
          duration    : 1,
          startcdate  : startCDate,
          expirycdate : expiryCDate,
          starttimes  : startTimes,
          expirytimes : expiryTimes,
          status      : 'active',
          type        : 'free'
        };

        let isUserAdded = await UsersController.createNewUser(postData);
        let SendRegistrationEMail = await EmailController.sendRegisterSuccessEmail(isUserAdded.email,isUserAdded._id);

        response.msg = constants.COMMON_MESSAGES.USER_CREATED;
        let signUserDetails = {};
        signUserDetails.fullname = isUserAdded.fullname;
        signUserDetails.province = isUserAdded.province;
        signUserDetails.city = isUserAdded.city;
        signUserDetails.mobile_number = isUserAdded.mobile_number;
        signUserDetails.email = isUserAdded.email;
        signUserDetails.id = isUserAdded._id;
        let UserDetailsToken = await utils.signToken(signUserDetails);

        response.success = true;
        response.data = {UserDetails:signUserDetails,token:UserDetailsToken};
      }
      return res.status(200).send(response);
    });
  });
});

router.get("/verify-user/:user_id", function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let user_id = req.params.user_id;
    let verifyUser = await UsersController.verifyUser(user_id);
    if(verifyUser){
      if (verifyUser.status && verifyUser.status == 'active') {
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.USER_VERIFIED;
        response.data = verifyUser;
      }else if(verifyUser.error && verifyUser.error == 'active'){
        response.success = false;
        response.msg = 'This account is already verified';
      }else{
        response.success = false;
        response.msg = "Unable to verify your account, You are currently "+ verifyUser.error + " by admin";
      }
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});

router.post("/user-login", function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let userFound = await UsersController.checkUserEmailExists(postData.email);
    if(userFound){
      let isPasswordValid  = await bcrypt.compareSync(postData.password,userFound.local.password);
      //let isPasswordValid = utils.matchPassword(postData.password,userFound.password);
      if(isPasswordValid){
        if (userFound.status == "active") {
          let signUserDetails = {};
          signUserDetails.fullname = userFound.fullname;
          signUserDetails.province = userFound.province;
          signUserDetails.city = userFound.city;
          signUserDetails.mobile_number = userFound.mobile_number;
          signUserDetails.email = userFound.email;
          signUserDetails.id = userFound._id;
          let currentime = moment().format("X");

          let subscriptions = userFound.subscriptions[0];

          if (parseInt(subscriptions.expirytimes) >  parseInt(currentime) &&  subscriptions.status == 'active' && subscriptions.type == 'paid') {
            signUserDetails.is_subscriber = true;
          }else{
            let getMyAllDataCounts = await CarsController.getMyAllDataCounts(userFound._id);
            if (getMyAllDataCounts == 0) {
              signUserDetails.is_subscriber = true;
            }else{
              signUserDetails.is_subscriber = false;
            }
          }
          if (userFound.avatarurl && userFound.avatarurl != '') {
            signUserDetails.avatarurl = process.env.SITE_URL+"user-images/"+userFound.avatarurl;
          }else{
            signUserDetails.avatarurl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.USER_PLACEHOLDER;
          }

          let UserDetailsToken = await utils.signToken(signUserDetails);

          response.success = true;
          response.data = signUserDetails;
          response.token = UserDetailsToken;
          // response.UserDetailsToken = UserDetailsToken;
          
        }else{
          if (userFound.status == "not_verified") {
            response.success = false;
            response.msg = "Please verify your email and try again";
          }else{
            response.success = false;
            response.msg = "Unable to login, You are currently "+ userFound.status + " by admin";
          }
        }
      }else{
        response.success = false;
        response.msg = customErrors.ERROR_CODES.DATABASE_ERROR.INVALID_PASSWORD.MESSAGE;
      }
    }else{
      response.success = false;
      response.msg = customErrors.ERROR_CODES.DATABASE_ERROR.INVALID_EMAIL_OR_USERNAME.MESSAGE;
    }
    return res.status(200).send(response);
  });
});

router.put("/update-user-details", [authetication.authenticate],function (req, res, next) {
  return Bluebird.try(async() => {
    let upload = Bluebird.promisify(uploadUserImageConfig);
    return upload(req, res).then(async(uploadData) => {
      let response = {};
      let postData = req.body;
      let user_id = req.user._id;
      if(req.files && (req.files.avatarurl)){
        postData.avatarurl = req.files.avatarurl[0].filename;
      }
      if(req.files && (req.files.logourl)){
        postData.logourl = req.files.logourl[0].filename;
      }
      if(postData.email && postData.email != ''){
        postData.email = postData.email.toLowerCase();
        let checkEmailExists = await UsersController.checkEmailExistsForUpdateUser(user_id,postData.email);

        if(checkEmailExists){
          response.success = false;
          response.msg = customErrors.ERROR_CODES.DATABASE_ERROR.EMAIL_EXISTS.MESSAGE;
          return res.status(200).send(response);
        }
      }
      let updatedDetails = await UsersController.updatedDetails(req.user._id,postData);
      if (updatedDetails) {
        if (req.files && (req.files.avatarurl) && req.user.avatarurl && req.user.avatarurl != '' && req.user.avatarurl != constants.PLACE_HOLDER_IMAGES.USER_PLACEHOLDER) {
          let userUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.USER_IMAGE);
          let imagePath =  userUploadDirPath+"/"+req.user.avatarurl;
          commonFunctionController.unlinkImage(imagePath);
        }

        if (req.files && (req.files.logourl) && req.user.logourl && req.user.logourl != '' && req.user.logourl != constants.PLACE_HOLDER_IMAGES.DEFAUT_PLACEHOLDER) {
          let userUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.USER_IMAGE);
          let imagePath =  userUploadDirPath+"/"+req.user.logourl;
          commonFunctionController.unlinkImage(imagePath);
        }
        response.success = true;

        if (updatedDetails.avatarurl && updatedDetails.avatarurl != '') {
          updatedDetails.avatarurl = process.env.SITE_URL+"user-images/"+updatedDetails.avatarurl;
        }else{
          updatedDetails.avatarurl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.USER_PLACEHOLDER;
        }

        if (updatedDetails.logourl && updatedDetails.logourl != '') {
          updatedDetails.logourl = process.env.SITE_URL+"user-images/"+updatedDetails.logourl;
        }else{
          updatedDetails.logourl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.DEFAUT_PLACEHOLDER;
        }

        delete updatedDetails.forgot_password_str;
        delete updatedDetails.arranger;
        delete updatedDetails.created_at;
        delete updatedDetails.updated_at;
        delete updatedDetails.local;
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

router.get("/get-user-profile-data",[authetication.authenticate], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};

    if(req.user && req.user != ''){

      let getMyCarDataCounts = await CarsController.getMyCarDataCounts(req.user._id);

      req.user.sold_cars_count  = getMyCarDataCounts.sold_cars_count;
      req.user.listing_cars_count = getMyCarDataCounts.listing_cars_count;
      req.user.favourite_cars_count  = req.user.favourite.length;

      if (req.user.avatarurl && req.user.avatarurl != '') {
        req.user.avatarurl = process.env.SITE_URL+"user-images/"+req.user.avatarurl;
      }else{
        req.user.avatarurl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.USER_PLACEHOLDER;
      }
      if (req.user.logourl && req.user.logourl != '') {
        req.user.logourl = process.env.SITE_URL+"user-images/"+req.user.logourl;
      }else{
        req.user.logourl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.DEFAUT_PLACEHOLDER;
      } 
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

router.post("/forgot-password", function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    if (postData.email && postData.email !='') {
      postData.email = postData.email.toLowerCase();
      let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      let checkValidMail = await re.test(String(postData.email).toLowerCase());
      if(checkValidMail){
        let checkUserExist = await UsersController.checkUserEmailExists(postData.email);
        if(checkUserExist){
          let generateForgotPassStr = await Math.random().toString(36).substring(2);
          let userData = {};
          userData.forgot_password_str = generateForgotPassStr;
          let updatedForgotPassStr = await UsersController.updatedDetails(checkUserExist._id,userData);
          checkUserExist.forgot_password_str = generateForgotPassStr;
          let sendForgotPasswordMail = await EmailController.sendForgotPasswordMail(checkUserExist);
          response.success = true;
          response.msg = 'We have send password link to your email';
        }else{
          response.success = false;
          response.msg = 'Email does not exist';
        }
      }else{
        response.success = false;
        response.msg = 'Please enter valid email address';
      }
    }else{
      response.success = false;
      response.msg = 'Email cannot be empty';
    }
    return res.status(200).send(response);
  });
});

router.get("/verify-forgot-password-string/:string", function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let randonString = req.params.string;
    if (randonString && randonString !='') {
      let checkUserExist = await  UsersController.checkRandomStringExist(randonString);
      if (checkUserExist) {
        let signUserDetails = {};
        signUserDetails.fullname = checkUserExist.fullname;
        signUserDetails.province = checkUserExist.province;
        signUserDetails.city = checkUserExist.city;
        signUserDetails.mobile_number = checkUserExist.mobile_number;
        signUserDetails.email = checkUserExist.email;
        signUserDetails.id = checkUserExist._id;
        let UserDetailsToken = await utils.signToken(signUserDetails);
        response.success = true;
        response.data = signUserDetails;
        response.token = UserDetailsToken;
      }else{
        response.success = false;
        response.msg = 'Cannot verify your request, Please try again';
      }
    }else{
      response.success = false;
      response.msg = 'Cannot verify your request, Please try again';
    }
    return res.status(200).send(response);
  });
});

router.get("/get-dealer-profile/:dealer_id", function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let dealer_id = req.params.dealer_id;
    let getDealerProfile = await  UsersController.getDealerProfile(dealer_id);
    if(getDealerProfile){
      let getDealerCarDataCounts = await CarsController.getMyCarDataCounts(dealer_id);
      getDealerProfile.dealer_info;
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.sold_cars_count = getDealerCarDataCounts.sold_cars_count;
      response.listing_cars_count = getDealerCarDataCounts.listing_cars_count;
      response.average_rating = getDealerProfile.ratings.average_rating;
      response.total_reviews = getDealerProfile.ratings.total_reviews;
      response.data = getDealerProfile.dealer_info;
      response.ratings_and_reviews = getDealerProfile.ratings_and_reviews;
    }else{
      response.success = false;
      response.msg = 'Dealer profile data not exist';
    }
    return res.status(200).send(response);
  });
});

router.post("/reset-user-password/:string", function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let randomString = req.params.string;
    if (randomString && randomString !='') {
      let checkUserExist = await  UsersController.checkRandomStringExist(randomString);
      if (checkUserExist) {
        if (postData.new_password && postData.new_password != ''){
          if (postData.confirm_password && postData.confirm_password !='') {
            if (postData.new_password == postData.confirm_password !='') {
              let generateForgotPassStr = await Math.random().toString(36).substring(2);
              let userData = {}
              userData.forgot_password_str = generateForgotPassStr;
              var salt = await  bcrypt.genSaltSync(10);
              var hash = await bcrypt.hashSync(postData.new_password, salt);
              userData.local = {password:hash};
              let updatedPassword = await UsersController.updatedDetails(checkUserExist._id,userData);
              if (updatedPassword) {
                response.success = true;
                response.msg = constants.COMMON_MESSAGES.USER_PASSWORD_UPDATED;
              }else{
                response.success = false;
                response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR
              }
            }
            else{
              response.success = false;
              response.msg = 'confirm password not valid';
            }
          }else{
            response.success = false;
            response.msg = 'confirm password cannot be empty';
          }  
        }else{
          response.success = false;
          response.msg = 'New password cannot be empty';
        }
      }else{
        response.success = false;
        response.msg = 'User not found, Please try again';
      }
    }else{
      response.success = false;
      response.msg = 'Cannot verify your request, Please try again';
    }
    return res.status(200).send(response);
  });
});

  router.post("/change-user-password",[authetication.authenticate], function (req, res, next) {
    return Bluebird.try(async() => {
      let old_password = "";
      let new_password = "";
      let confirm_password = "";
      let response = {};
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
     
      let isPasswordValid  = await bcrypt.compareSync(old_password,req.user.local.password);
      
      if(isPasswordValid){
        if((new_password == confirm_password) && (new_password != "")){
          //var salt = await  bcrypt.genSaltSync(10);
          new_password = await bcrypt.hashSync(new_password, salt);
          let updateData = {};
          updateData.local = {password:new_password};
          return UsersController.updatedDetails(req.user._id,updateData)
          .then((isUpdated)=>{
            response.success = true;
            response.msg = constants.APP_LANGUAGE_CONSTANTS.en.PASSWORD_CHANGES_SUCCESSFULLY;  
            return res.status(200).send(response);
          });
        }else{
          if(new_password == ""){
            response.success = false;
            response.msg = constants.APP_LANGUAGE_CONSTANTS.en.NEW_PASSWORD_SHOULD_NOT_BE_BLANK; 
          }else{
            response.success = false;
            response.msg = constants.APP_LANGUAGE_CONSTANTS.en.PASSWORD_AND_CONFIRM_PASSWORD_SHOULD_MATCH;
          }
        }
      }else{
        response.success = false;
        response.msg = constants.APP_LANGUAGE_CONSTANTS.en.PLEASE_ENTER_CORRECT_OLD_PASSWORD;
      }
      return res.status(200).send(response);
    });
  });

  router.put("/update-subscription",[authetication.authenticate], function (req, res, next) {
    return Bluebird.try(async() => {
      let response = {success:false};
      let postData = req.body;
      if (postData.sub_id && postData.sub_id != '') {
        let getSubscriptionById = await  UsersController.getSubscriptionById(postData.sub_id);
        if (getSubscriptionById) {
          let startDate   = moment();
          let expiryDate  = await commonFunctionController.addRealMonth(startDate, 1);
          let startCDate  = await startDate.format('YYYY-MM-DD');
          let expiryCDate = await expiryDate.format('YYYY-MM-DD');
          let startTimes  = await startDate.format("X");
          let expiryTimes = await expiryDate.format("X");
          let userData = {};
          userData.subscriptions = [];
          userData.subscriptions[0] = {
            name        : getSubscriptionById.name, 
            title       : getSubscriptionById.title, 
            amount      : getSubscriptionById.number, 
            price       : parseInt(getSubscriptionById.price), 
            duration    : 1,
            startcdate  : startCDate,
            expirycdate : expiryCDate,
            starttimes  : startTimes,
            expirytimes : expiryTimes,
            status      : 'active',
            type        : 'paid'
          };

          let pushOldSubscToHistory = await UsersController.pushOldSubscToHistory(req.user._id,req.user.subscriptions[0]);
          let updatedDetails = await UsersController.updatedDetails(req.user._id,userData);
          if (updatedDetails) {
            response.success = true;
            response.data = updatedDetails;
            response.msg = "Your Plan Activate Successfull";
          }else{
            response.success = false;
            response.msg = customErrors.ERROR_CODES.UNKNOWN_ERROR.MESSAGE;
          }
        }else{
          response.success = false;
          response.msg = "Subscription Plan Not Found";
        }
      }else{
        response.success = false;
        response.msg = "Empty Subscription Id";
      }
      return res.status(200).send(response);
    });
  });

  router.post("/apply-subscription-order",[authetication.authenticate], function (req, res, next) {
    return Bluebird.try(async() => {
      let response = {success:false};
      let postData = req.body;
      let deletePendingSubscriptionOrder = await UsersController.deletePendingSubscriptionOrder(req.user);
        let getSubscriptionById = await  UsersController.getSubscriptionById(postData.subs_id);
        if (getSubscriptionById) {
          let user  = req.user;
          let sub   = getSubscriptionById;
          postData.duration = parseInt(postData.duration);
          let order = {
              creator   : user._id,
              fullname  : user.fullname,
              email     : user.email,
              gsm       : user.gsm,
              sub       : {
                  subname  : sub.name,
                  title    : sub.title,
                  amount   : sub.number,
                  duration : postData.duration,
                  price    : sub.price,
                  sub_id   : sub._id,
                  sub_type   : sub.sub_type
              },
              status    : 'pending',
              date      : moment().format('YYYY-MM-DD'),
              timestamp : moment().format("X")
          }
          let duration = parseInt(postData.duration), duration1;
          let amount   = sub.number*duration;
          let price    = sub.price*duration;
          if (duration == 1) {
              duration1 = "1 Month";
          } else if (duration == 12) {
              duration1 = "1 Year";
          } else if (duration == 24) {
              duration1 = "2 Years";
          } else {
              duration1 = duration+ " Months";
          }
          let mailData = {
            usermail    : user.email,
            fullname    : user.fullname,
            subname     : sub.name,
            subtitle    : sub.title,
            price       : price,
          }
          let applyOrder = await UsersController.applyOrder(order);
          if(applyOrder){

            // let mailOptions = {
            //   from: '"Chat2Cars" <'+constants.SITE_EMAIL_ADDRESS+'>', // sender address
            //   //to: req.user.email,    // list of receivers , danielchat2cars@gmail.com
            //   to: 'akshay.devstree@gmail.com',
            //   subject: 'Your Chat2Cars order from '+moment().format('YYYY-MM-DD')+' has been received', // Subject line
            //   html:
            //       'Hi '+req.user.fullname+',<br><br>'+
            //       'Thank you for your subscription.<br>'+
            //       'You just subscribed for our '+sub.name+' - '+sub.title+' plan for '+duration1+'.<br>'+
            //       'Kindly make payment using our banking details below.<br>'+
            //       'Note that your subscription will not be active until we confirm your payment.<br><br>'+
            //       'Bank: FNB<br>'+
            //       'Account Name: Kizzo General Trading<br>'+
            //       'Account Number: 62556266312<br>'+
            //       'Branch Code: 250655<br><br>'+
            //       'Amount to be paid:  R '+(price).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')+'<br>'+
            //       'Reference: '+user.email+'<br><br>'+
            //       'Regards<br>'+
            //       'Chat2cars' // html body
            //   };

            //let sendSubscriptionOrderEmail = await EmailController.sendSubscriptionOrderEmail(mailOptions);
            response.success = true;
            response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
            response.data = applyOrder;
          }else{
            response.success = false;
            response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
          }
        }else{
          response.success = false;
          response.msg = 'Subscription package not found';
        }
      return res.status(200).send(response);
    });
  });

  router.post("/get-dealer-list", function (req, res, next) {
    return Bluebird.try(async() => {
      let response = {success:false};
      let postData = req.body;
      let getDealerlist = await UsersController.getDealerList(postData);
      let checkDealer = getDealerlist.list;
      if(checkDealer.length>0){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.totalCount = getDealerlist.totalCount;
        response.data = getDealerlist.list;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
      return res.status(200).send(response);
    });
  });

  router.post("/get-user-dealer-count", function (req, res, next) {
    return Bluebird.try(async() => {
      let response = {success:false};
      let postData = req.body;
      let getDealerlist = await UsersController.getUserDealerCount(postData);
      let checkDealer = getDealerlist.list;
      if(checkDealer.length>0){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.totalCount = getDealerlist.totalCount;
        response.data = getDealerlist.list;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
      return res.status(200).send(response);
    });
  });

  router.post("/my-car-list",[authetication.authenticate], function (req, res, next) {
    return Bluebird.try(async() => {
      let response = {success:false};
      let postData = req.body;
      let userId = req.user._id;
      let mycars = await CarsController.getMyCars(postData,userId);
      let checkList = mycars.list;
      if(checkList.length>0){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.totalCount = mycars.totalCount;
        response.data = mycars.list;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
      return res.status(200).send(response);
    });
  });

  router.post("/add-rating-and-review",[authetication.authenticate], function (req, res, next) {
    return Bluebird.try(async() => {
      let response = {success:false};
      let postData = req.body;
      postData.user = req.user._id;
      postData.rating = parseInt(postData.rating);
      let addRatingAndReview = await UsersController.addRatingAndReview(postData);
      if(addRatingAndReview){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.data = addRatingAndReview;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
      return res.status(200).send(response);
    });
  });

  router.get("/get-my-subscription-history",[authetication.authenticate], function (req, res, next) {
    return Bluebird.try(async() => {
      let response = {success:false};
      let postData = req.body;
      if (req.user.histories) {
        let subHistory = req.user.histories;
        if(subHistory.length>0){
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
          response.data = subHistory;
        }else{
          response.success = false;
          response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
        }
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
      return res.status(200).send(response);
    });
  });

  router.get("/update-user-images", function (req, res, next) {
    return Bluebird.try(async() => {
      let response = {success:false};
      let updateUserImages = await UsersController.updateUserImages();
      if(updateUserImages.length>0){
        response.success = true;
        response.msg = 'Data Updated Successfull';
        response.data = updateUserImages;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
      return res.status(200).send(response);
    });
  });

  router.post('/send/car-enquiry-mail', function (req, res, next) {
    return Bluebird.try(async() => {
      let response = {success:false};
      let postData = req.body;
      let getSingleCar = await  CarsController.getSingleCarData(req.body.car_id);
      // console.log("getSingleCar : ",getSingleCar);
      // return res.status(200).send(getSingleCar);
      if(getSingleCar){

        let name      = req.body.name;
        let gsm       = req.body.gsm;
        let email     = req.body.email;
        let message   = req.body.message;
        
        let location  = '';
        if(getSingleCar.creator.address && getSingleCar.creator.address != ''){
          location = getSingleCar.creator.address;
        }else if(getSingleCar.creator.city && getSingleCar.creator.city != ''){
          location = getSingleCar.creator.city;
        }
        
        let imagepath = getSingleCar.featured_image;
        let subject   = 'Car Enquiry';  
        let to        = getSingleCar.creator.email;
		let slug = getSingleCar.slug;

      if (name.length == 0 || gsm.length == 0 || (email.length == 0 && /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) == false) || message.length == 0) {
        response.success = false;
        response.msg = "All field is required.";
      } else {
          
          postData.dealer_id = getSingleCar.creator;
          let saveEnquiryMail = await UsersController.saveEnquiryMail(postData);
          let currentime = moment().format("X");


          let subsciption = getSingleCar.creator.subscriptions[0];

          console.log("subsciption : ",subsciption);

          console.log("currentime : ",currentime);

          if (parseInt(subsciption.expirytimes) >  parseInt(currentime) &&  subsciption.status == 'active' && subsciption.type == 'paid') {

            let EnquiryMailData = {
              name : name, 
              gsm : gsm, 
              email : email, 
              message : message, 
              location : location,
              imagepath : imagepath,
              subject : subject,
              to : to,
			  slug: slug
            }
            let sendEnquiryEmail = await EmailController.sendEnquiryEmail(EnquiryMailData);
          }else{
             // email send to chattocars gmail 

          let EnquiryMailData = {
            name: name,
            gsm: gsm,
            email: email,
            message: message,
            location: location,
            imagepath: imagepath,
            subject: subject,
            to: constants.Cc_EMAIL,
			slug: slug
			
          }
          let sendEnquiryEmail = await EmailController.sendEnquiryEmail(EnquiryMailData);


            let mailOptions = {
               from: '"Chat2Cars" - <'+constants.SITE_EMAIL_ADDRESS+'>', // sender address
               to: to, // list of receivers , aliyuaminu14@gmail.com
               //to: 'akshay.devstree@gmail.com',
			    cc: constants.Cc_EMAIL,
               subject: 'Chat2Cars - Car Enquiry', // Subject line
               html: 'Someone has submited an enquiry for your listed car on chat2cars.co.za'+
               '<br><br> Please purchase subscription to see enquiry details'+
               '<br><br> Click the link to Buy subscription plan <a href= '+process.env.WEBSITE_URL+'subscriptions>'+process.env.WEBSITE_URL+'subscriptions</a>'
              };
			
             let sendExpiryMail = await EmailController.defaultMailSend(mailOptions);

          }
          response.success = true;
          response.msg = "Mail sent successfully";
          response.data = saveEnquiryMail;
      }

    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }

    return res.status(200).send(response);
  });
});


router.post("/enquiry/my-cars-enquiry-list",[authetication.authenticate], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    postData.userid = req.user._id;
    let getMyCarsEnquiry = await UsersController.getMyCarsEnquiry(postData);
    if(getMyCarsEnquiry.list.length>0){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.totalCount = getMyCarsEnquiry.totalCount;
      response.data = getMyCarsEnquiry.list;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

router.post("/payment/save-payment-details", function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let savePaymentData = await UsersController.savePaymentData(postData);
    if(savePaymentData){
      if(savePaymentData.payment_status == 'COMPLETE'){
        let commitUserOrder = await UsersController.commitUserSubscription(savePaymentData.custom_str1);
        if (commitUserOrder) {
          response.success = true;
          response.msg = 'Your subscription has been actived';
          response.data = commitUserOrder;
        }else{
          response.success = false;
          response.msg = 'Something went wrong, while applying your order, Please again , or Contact our customer care service';
        }
      }else{
        response.success = false;
        response.msg = 'Your payment is not complete , Please try again'
      }
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

router.get("/orders/get-my-orders",[authetication.authenticate], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let getMyOrders = await UsersController.getMyOrders(req.user._id);
    if(getMyOrders.length>0){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.data = getMyOrders;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

router.get("/orders/cancel-my-order/:orderid",[authetication.authenticate], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    if (req.params.orderid && req.params.orderid != '') {
      let getOrderDetails = await UsersController.GetOrderDetails(req.params.orderid);
      if (getOrderDetails && getOrderDetails.status == 'pending') {
        let cancelMyOrder = await UsersController.cancelMyOrder(req.params.orderid);
        if(cancelMyOrder){
          let mailOptions = {
            from: '"Chat2Cars" <'+constants.SITE_EMAIL_ADDRESS+'>', // sender address
            //to: req.user.email,    // list of receivers , aliyuaminu14@gmail.com
            to: 'akshay.devstree@gmail.com',
            subject: 'Your Chat2Cars order from '+moment().format('YYYY-MM-DD')+' has been cancelled', // Subject line
            html: 'Hi '+req.user.fullname+',<br><br> Your recent order on Chat2Cars has been cancelled.' // html body
          };
          let sendSubscriptionOrderEmail = await EmailController.defaultMailSend(mailOptions);
          response.success = true;
          response.msg = 'Your recent order has been canceled successfully';
          response.data = cancelMyOrder;
        }else{
          response.success = false;
          response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
        }
      }else{
        response.success = false;
        response.msg = "You can't cancel your order now";
      }
    }else{
      response.success = false;
      response.msg = 'Order id cannot be empty';
    }
    return res.status(200).send(response);
  });
});

router.get("/get-dealership-list", function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let getDealershipList = await UsersController.getDealershipList();
    if(getDealershipList.length>0){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.data = getDealershipList;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

router.get("/update-user-email", function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let updateAllUserEmail = await UsersController.updateAllUserEmail();
    if(updateAllUserEmail.length>0){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.data = updateAllUserEmail;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});


router.get("/orders/update-user-email", function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let updateAllOrderEmails = await UsersController.updateAllOrderEmails();
    if(updateAllOrderEmails.length>0){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.data = updateAllOrderEmails;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

module.exports = router;
