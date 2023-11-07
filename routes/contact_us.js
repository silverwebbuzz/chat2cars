"use strict";

const router = require("express-promise-router")();
const Bluebird = require("bluebird");
const validations = require("../utils/validations");
const utils = require("../utils/utils");
const constants = require("../utils/constants");
const customErrors = require("../utils/errors");
const multerSettings = require("../utils/multer-settings");
const authetication = require("../middleware/authentication");
const commonFunctionController = require("../controllers/common_functions");
const EmailController = require("../controllers/email");
const ContactUsController = require("../controllers/contact_us");
const path = require("path");
const moment     = require('moment');


router.post("/save-contact-us-email",[authetication.not_required_authentication], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;

    console.log("postData : ",postData);

    let saveContactUsMail = await ContactUsController.saveContactUsMail(postData,req.user);
    if(saveContactUsMail){
      let SendContactUsMail = await EmailController.sendContactUsMail(saveContactUsMail);
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.CONTACT_US_EMAIL_SAVED;
      response.data = saveContactUsMail;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});

router.post("/get-contact-us-list",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let getContactUsList = await ContactUsController.getContactUsList(postData);
    if(getContactUsList.list.length>0){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.count_records = getContactUsList.totalCount;
      response.data = getContactUsList.list; 
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});


router.delete("/delete-single-record/:record_id",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let record_id = req.params.record_id;
    let deleteSingleRecord = await ContactUsController.deleteSingleRecord(record_id);
    if(deleteSingleRecord){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_DELETED;
      response.data = deleteSingleRecord; 
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});


router.put("/update-contact-us-details",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let response = {success:false};
    let postData = req.body;
    let updatedData = await ContactUsController.updateDetails(postData);
    if(updatedData){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_UPDATED;
      response.data = updatedData; 
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});



  


module.exports = router;