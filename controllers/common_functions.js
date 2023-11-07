"use strict";

const Bluebird = require("bluebird"); 
const AdminModel = require("../models/admin_master");
const UsersModel = require("../models/users");
const constants = require("../utils/constants");
const utils = require("../utils/utils");
const crypto = require('crypto');
const mongodb = require('mongodb');
const fs = require('fs');
const moment     = require('moment');
const path = require("path");
const im = require('imagemagick');

const escapeRegex = function(string){
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

const findUserById = function (UserId) {
  return Bluebird.try(() => {
    return UsersModel.findById(UserId).lean();
  }).catch((error) => {
    console.error(error);
  });
};

const unlinkImage = function(imagePath){
  return Bluebird.try(async() => {
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error(err);
        return false;
      }else{
        console.log("unlinked successfull");
        return true;
      }
    })
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const addRealMonth = function(d, duration){
  return Bluebird.try(async() => {
    let fm    = moment(d).add(duration, 'M');
    let fmEnd = moment(fm).endOf('month');
    return d.date() != fm.date() && fm.isSame(fmEnd.format('YYYY-MM-DD')) ? fm.add(1, 'd') : fm;  
 }).catch((error) => {
    console.error(error);
    return error;
  });
};

const compressCarsImages = function(carsImages){
  return Bluebird.try(async() => {
    return Bluebird.map(carsImages, async function (row) {
      let  CarImagesUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.TEST_FOLDER);
      let imagepath = CarImagesUploadDirPath+""+row.filename;
      im.resize({
        srcData: fs.readFileSync(imagepath, 'binary'),
        quality: 0.6,
        width:   760,
        height:  760
      }, function(err, stdout, stderr){
        if (err) throw err
        fs.writeFileSync(imagepath, stdout, 'binary');
      });
      return row.filename;
    }).then(async(returnData) => {
      return returnData;
    });
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

module.exports = {
  unlinkImage:unlinkImage,
  addRealMonth:addRealMonth,
  escapeRegex:escapeRegex,
  findUserById:findUserById,
  compressCarsImages:compressCarsImages
};