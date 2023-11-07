"use strict";

const router = require("express-promise-router")();
const Bluebird = require("bluebird");
const validations = require("../utils/validations");
const usersController = require("../controllers/users");
const utils = require("../utils/utils");
const constants = require("../utils/constants");
const customErrors = require("../utils/errors");
const multerSettings = require("../utils/multer-settings");
const authetication = require("../middleware/authentication");
const commonFunctionController = require("../controllers/common_functions");
const appointmentController = require("../controllers/appointments");
const path = require("path");
const uploadCarsImageConfig = multerSettings.uploadCarsImageConfig;
const moment = require('moment');
const EmailController = require("../controllers/email");

router.post("/save-appointment",[authetication.not_required_authentication], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    if (postData.date && postData.date != '') {
      postData.date = moment(postData.date).format('YYYY-MM-DD');
    }
    if (postData.date_of_birth && postData.date_of_birth != '') {
      postData.date_of_birth = moment(postData.date_of_birth).format('YYYY-MM-DD');
    }
    
    if (req.user && req.user != '' && req.user._id && req.user._id != '') {
      postData.creator = req.user._id;
    }

    let saveAppointment = await appointmentController.saveAppointment(postData);
    if(saveAppointment){

      var appointmentDate = new Date(saveAppointment.date);
      var date = appointmentDate.getDate();
      var month = appointmentDate.getMonth() + 1; // Since getMonth() returns month from 0-11 not 1-12
      var year = appointmentDate.getFullYear();
      saveAppointment.date = date + "/" + month + "/" + year;

      var dob = new Date(saveAppointment.date_of_birth);
      date = dob.getDate();
      month = dob.getMonth() + 1; // Since getMonth() returns month from 0-11 not 1-12
      year = dob.getFullYear();
      saveAppointment.date_of_birth = date + "/" + month + "/" + year;

      let sendAppointmentMail = await EmailController.sendAppointmentMail(saveAppointment);
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.SAVE_APPOINTMENT;
      response.data = saveAppointment;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});

router.post("/get-appointment-list",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let getAppointments = await appointmentController.getAppointments(postData);
    let checkList = getAppointments.list;
    if(checkList.length>0){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.totalCount = getAppointments.totalCount;
      response.data = getAppointments.list;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});



router.get("/get-single-appointment/:appointment_id",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let appointment_id = req.params.appointment_id;
    let getAppointmentData = await appointmentController.getSingleAppointment(appointment_id);
    if(getAppointmentData){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.data = getAppointmentData;
    }else{
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

router.put("/update-appointment-status",[authetication.authenticate_admin], function (req, res, next) {
  return Bluebird.try(async() => {
    let postData = req.body;
    let response = {success:false};
    let appointment_id = postData.appointment_id;
    delete postData.appointment_id;
    let updateAppointmentStatus = await appointmentController.updateAppointmentStatus(appointment_id,postData);
    if(updateAppointmentStatus){
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_UPDATED;
      response.data = updateAppointmentStatus;
    }else{
      response.success = false;
      response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
    }
    return res.status(200).send(response);
  });
});


module.exports = router;