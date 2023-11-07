"use strict";

const Bluebird = require("bluebird"); 
const UsersModel = require("../models/users");
const constants = require("../utils/constants");
const utils = require("../utils/utils");
const crypto = require('crypto');
const mongodb = require('mongodb');
const citiesModel = require("../models/cities");
const statesModel = require("../models/states");


const saveCitiesAndStates = function (postData,arrayLength,j) {
    return Bluebird.try(async() => { 
        if (postData[j] && postData[j] != '' && postData[j] != undefined && postData[j] != 'undefined') {
            var row = postData[j];
            let checkOrSaveState = await GetOrSaveState(row);
            let checkOrSaveCity = await GetOrSaveCity(row,checkOrSaveState);
            if (arrayLength == j) {
                console.log("true",j);
                return true;
            } else {
                console.log("loop");
                j++;
                saveCitiesAndStates(postData,arrayLength,j);
            }
        }
    }).catch((error) => {   
      console.error(error);
      return error;
    });
  };

  const GetOrSaveState = function (singleData) {
    return Bluebird.try(async() => { 
        let getState = await statesModel.findOne({state_name:singleData.admin}).lean();
        if (getState && getState != '') {
            console.log(getState);
            return getState._id;
        }else{
            let saveState = {};
            saveState.state_name = singleData.admin;
            saveState.country_name = singleData.country;
            let stateData = new statesModel(saveState);
            return stateData.save()
            .then((isSaved)=>{    
                return isSaved._id
            });
        }
    }).catch((error) => {   
      console.error(error);
      return error;
    });
  };

  const GetOrSaveCity = function (singleData,state_id) {
    return Bluebird.try(async() => { 
        let getCity = await citiesModel.findOne({city_name:singleData.city,state:state_id}).lean();
        if (getCity && getCity != '') {
            return getCity;
        }else{
            let saveCity = {};
            saveCity.city_name = singleData.city;
            saveCity.state = state_id;
            saveCity.lat = singleData.lat;
            saveCity.lng = singleData.lng;
            let cityData = new citiesModel(saveCity);
            return cityData.save()
            .then((isSaved)=>{    
                return citiesModel.findById(isSaved._id).populate("state").lean();
            });
        }
    }).catch((error) => {   
      console.error(error);
      return error;
    });
  };

  const getAllStates = function (postData) {
    return Bluebird.try(async() => { 
        // let limit = 10;
        // let skip = 0;
        // let query = {};
        // let arranger = { created_at : -1 };
        // if (postData.limit && postData.limit != '') { 
        // limit = await parseInt(postData.limit);
        // }
        // if (postData.page && postData.page != '') {
        // let page = await parseInt(postData.page);
        // page = page-1;
        // skip = page*limit;
        // }
        //query  = { $and: [{}]};
        // let listStates = await statesModel.find(query).sort(arranger).skip(skip).limit(limit).lean();
        // let StatesCount = await statesModel.find(query).sort(arranger).count().lean();
        // let returnArray = {};
        // returnArray.list = listStates;
        // returnArray.totalCount = StatesCount;
        let returnArray = await statesModel.find({}).select("_id state_name country_name").lean();
        return returnArray;
    }).catch((error) => {   
      console.error(error);
      return error;
    });
  };

  const getCitiesbyStateIds = function (postData) {
    return Bluebird.try(async() => { 
        let states = postData.state_ids
        var statesArray = states.split(",");
        let returnArray = await citiesModel.find({ state: { $in: statesArray } }).select("_id city_name lat lng state").populate("state","_id state_name").lean();
        return returnArray;
    }).catch((error) => {   
      console.error(error);
      return error;
    });
  };

  module.exports = {
    saveCitiesAndStates:saveCitiesAndStates,
    GetOrSaveState:GetOrSaveState,
    GetOrSaveCity:GetOrSaveCity,
    getAllStates:getAllStates,
    getCitiesbyStateIds:getCitiesbyStateIds
  }