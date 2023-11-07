"use strict";

const Bluebird = require("bluebird");
const UsersModel = require("../models/users");
const constants = require("../utils/constants");
const utils = require("../utils/utils");
const crypto = require('crypto');
const mongodb = require('mongodb');
const ContactUsModel = require("../models/contact_us");


const saveContactUsMail = function (contactUsData,userData) {
  return Bluebird.try(async() => {
    if (userData && userData !='') {
      contactUsData.creator = userData._id;
    }
    contactUsData.mobile_number = parseInt(contactUsData.mobile_number);
    let savecontactUsData = new ContactUsModel(contactUsData);
    return savecontactUsData.save()
    .then((isSaved)=>{    
      return ContactUsModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getContactUsList = function (postData) {
  return Bluebird.try(async() => {
    let limit = 10;
    let skip = 0;
    let query = {};
    let arranger = {created_at : -1};
    if (postData.limit && postData.limit != '') { 
      limit = await parseInt(postData.limit);
    }
    if (postData.page && postData.page != '') {
      let page = await parseInt(postData.page);
      page = page-1;
      skip = page*limit;
    }
    query["$and"] = [{}];
    if(postData.search && postData.search){
      let regex = new RegExp(postData.search, "i");
      query["$or"] = [{ fullname: regex }, { email: regex }];
    }

    let TotalRecords = await ContactUsModel.find(query).sort(arranger).countDocuments().lean();
    let List = await ContactUsModel.find(query).sort(arranger).skip(skip).limit(limit).lean();

    let returnArray = {};
    returnArray.list = List;
    returnArray.totalCount = TotalRecords;
    return returnArray;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const deleteSingleRecord = function (record_id) {
  return Bluebird.try(async() => {
    let deleteRecord = await ContactUsModel.remove({_id:record_id});
    return deleteRecord
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const updateDetails = function (postData) {
  return Bluebird.try(async() => {
    let contact_id = postData.contact_id;
    delete postData.contact_id;
    return ContactUsModel.findOneAndUpdate({_id:contact_id},{$set:postData},{new:true}).lean();
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

module.exports = {
  saveContactUsMail:saveContactUsMail,
  getContactUsList:getContactUsList,
  deleteSingleRecord:deleteSingleRecord,
  updateDetails:updateDetails
};