"use strict";

const Bluebird = require("bluebird");
const utils = require("../utils/utils");
const CustomError = require("../utils/custom-error");
const errors = require("../utils/errors").ERROR_CODES;
const UserController = require("../controllers/users");
//const ParentController = require("../controllers/parent_master");
const AdminController = require("../controllers/admin_master");
const commonFunctionController = require("../controllers/common_functions");

const authenticate = function (req, res, next) {
  return Bluebird.try(() => {
    let token = req.headers.authorization;
    // console.log("TOKEN ", token.split(" ")[1]);
    if (!token) {
      throw CustomError._401(errors.AUTH_TOKEN.REQUIRED.CODE, errors.AUTH_TOKEN.REQUIRED.MESSAGE);
    }

    if (token.split(" ").length !== 2) {
      throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
    }

    if (token.split(" ")[0] !== "Bearer") {
      throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
    }
    return utils.verifyToken(token.split(" ")[1]);
  }).then((verifiedToken) => {
    console.log("AUTHENTICATION SUCCESS verifiedToken ", verifiedToken);

    if (!verifiedToken.data || !verifiedToken.data.id || verifiedToken.iss !== "iBlazing") {
      throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
    }

    return UserController.findUserById(verifiedToken.data.id).then((userDetails) => {
      // console.log("AUTHENTICATION USER DETAILS ", userDetails);
      if (userDetails) {
      //  userDetails = UserController.modifyUserData(userDetails);
        req.user = userDetails;
      } else {
        throw CustomError._404(errors.USER_NOT_FOUND.CODE, errors.USER_NOT_FOUND.MESSAGE);
      }

      return next();
    });
  });
};

const authenticate_admin = function (req, res, next) {
  return Bluebird.try(() => {
    let token = req.headers.authorization;
    req.user;
   // console.log("========="+token);
     //console.log("TOKEN ", token.split(" ")[1]);
    if (!token) {
      throw CustomError._401(errors.AUTH_TOKEN.REQUIRED.CODE, errors.AUTH_TOKEN.REQUIRED.MESSAGE);
    }

    if (token.split(" ").length !== 2) {
      throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
    }

    if (token.split(" ")[0] !== "Bearer") {
      throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
    }
    return utils.verifyToken(token.split(" ")[1]);
  }).then((verifiedToken) => {
    console.log("AUTHENTICATION SUCCESS verifiedToken ", verifiedToken);

    if (!verifiedToken.data || !verifiedToken.data.id || verifiedToken.iss !== "iBlazing") {
      throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
    }

    console.log("verifiedToken",verifiedToken);

    return AdminController.findAdminById(verifiedToken.data.id).then((userDetails) => {
      // console.log("AUTHENTICATION USER DETAILS ", userDetails);
      if (userDetails) {
        //userDetails = AdminController.modifyUserData(userDetails);
        req.user = userDetails;
      } else {
        throw CustomError._404(errors.USER_NOT_FOUND.CODE, errors.USER_NOT_FOUND.MESSAGE);
      }
      return next();
    });
  });
};

const authenticate_common = function (req, res, next) {
  return Bluebird.try(() => {
    let token = req.headers.authorization;
   // console.log("========="+token);
     //console.log("TOKEN ", token.split(" ")[1]);
    if (!token) {
      throw CustomError._401(errors.AUTH_TOKEN.REQUIRED.CODE, errors.AUTH_TOKEN.REQUIRED.MESSAGE);
    }

    if (token.split(" ").length !== 2) {
      throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
    }

    if (token.split(" ")[0] !== "Bearer") {
      throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
    }
    return utils.verifyToken(token.split(" ")[1]);
  }).then((verifiedToken) => {
    console.log("AUTHENTICATION SUCCESS verifiedToken ", verifiedToken);

    if (!verifiedToken.data || !verifiedToken.data.id || verifiedToken.iss !== "iBlazing") {
      throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
    }

    return commonFunctionController.findUserById(verifiedToken.data.id).then((userDetails) => {
      // console.log("AUTHENTICATION USER DETAILS ", userDetails);
      if (userDetails) {
        //userDetails = AdminController.modifyUserData(userDetails);
        req.user = userDetails;
      } else {
        throw CustomError._404(errors.USER_NOT_FOUND.CODE, errors.USER_NOT_FOUND.MESSAGE);
      }
      return next();
    });
  });
};


const not_required_authentication = function (req, res, next) {
  return Bluebird.try(() => {

    let token = req.headers.authorization;
   // console.log("========="+token);
     //console.log("TOKEN ", token.split(" ")[1]);
    if (!token) {
   
      return req.user = '';
      //throw CustomError._401(errors.AUTH_TOKEN.REQUIRED.CODE, errors.AUTH_TOKEN.REQUIRED.MESSAGE);
    }
    if (token.split(" ").length !== 2) {
      throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
    }

    if (token.split(" ")[0] !== "Bearer") {
      throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
    }
    return utils.verifyToken(token.split(" ")[1]);
  }).then((verifiedToken) => {
    if (!verifiedToken) {
      //no user found
      return next();
    }else{
      console.log("AUTHENTICATION SUCCESS verifiedToken ", verifiedToken);
      if (!verifiedToken.data || !verifiedToken.data.id || verifiedToken.iss !== "iBlazing") {
        throw CustomError._401(errors.AUTH_TOKEN.NOT_VALID.CODE, errors.AUTH_TOKEN.NOT_VALID.MESSAGE);
      }
      return commonFunctionController.findUserById(verifiedToken.data.id).then((userDetails) => {
        // console.log("AUTHENTICATION USER DETAILS ", userDetails);
        if (userDetails) {
          //userDetails = AdminController.modifyUserData(userDetails);
          req.user = userDetails;
        } else {
          throw CustomError._404(errors.USER_NOT_FOUND.CODE, errors.USER_NOT_FOUND.MESSAGE);
        }
        return next();
      });
    }
  });
};





module.exports = {
  authenticate: authenticate,
  authenticate_admin:authenticate_admin,
  authenticate_common:authenticate_common,
  not_required_authentication:not_required_authentication
};
