"use strict";

const Bluebird = require("bluebird"); 
const UsersModel = require("../models/users");
const constants = require("../utils/constants");
const utils = require("../utils/utils");
const crypto = require('crypto');
const mongodb = require('mongodb');
const commonFunctionController = require("../controllers/common_functions");
const appointmentModel = require("../models/appointments");
const path = require("path");
const url = require("url");


const saveAppointment = function (apointmentData) {
    return Bluebird.try(() => { 
        let saveAppointmentData = new appointmentModel(apointmentData);
        return saveAppointmentData.save()
        .then((isSaved)=>{    
        return appointmentModel.findById(isSaved._id).lean();
        });
    }).catch((error) => {   
        console.error(error);
        return error;
    });
};

const getAppointments = function (postData) {
    return Bluebird.try(async() => { 
        let limit = 10;
        let skip = 0;
        let query = {};
        let arranger = { created_at : -1 };
        if (postData.limit && postData.limit != '') { 
            limit = await parseInt(postData.limit);
        }
        if (postData.page && postData.page != '') {
            let page = await parseInt(postData.page);
            page = page-1;
            skip = page*limit;
        }
        if (postData.sort_by && postData.sort_by == 'date') {arranger = { date : -1 }};
        if (postData.appointment_id && postData.appointment_id != '') {query._id = postData.appointment_id};
        if (postData.email && postData.email != '') {query.email = postData.email};
        if (postData.mobile_number && postData.mobile_number != '') {query.mobile_number = postData.mobile_number};

        let getAppointmentCount = await appointmentModel.find(query).sort(arranger).countDocuments().lean();
        let getAppointmentList = await appointmentModel.find(query).populate("creator", '_id email fullname mobile_number').sort(arranger).skip(skip).limit(limit).lean();

        let returnArray = {};
        returnArray.list = getAppointmentList;
        returnArray.totalCount = getAppointmentCount;
        return returnArray;
    }).catch((error) => {   
        console.error(error);
        return error;
    });
};

const getSingleAppointment = function (apointment_id) {
    return Bluebird.try(async() => { 
        let getAppointmentData = await  appointmentModel.findById(apointment_id).populate("creator", '_id email fullname mobile_number').lean();
        return getAppointmentData;
    }).catch((error) => {   
        console.error(error);
        return error;
    });
};



const updateAppointmentStatus = function(appointment_id,postData){
    return Bluebird.try(async() => {
      return appointmentModel.findOneAndUpdate({_id:appointment_id},{$set:postData},{new:true}).lean();
    }).catch((error) => {
      console.error(error);
      return error;
    });
  };

module.exports = {
    saveAppointment:saveAppointment,
    getAppointments:getAppointments,
    getSingleAppointment:getSingleAppointment,
    updateAppointmentStatus:updateAppointmentStatus
};