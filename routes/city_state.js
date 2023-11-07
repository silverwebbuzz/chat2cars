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
const cityStateController = require("../controllers/city_state");


router.post("/save-cities-and-states",[authetication.authenticate_admin], function (req, res, next) {
    return Bluebird.try(async() => {
        let postData = req.body;
        let response = {success:false};
        let j = 0;
        let arrayData = postData.data_array
        let arrayLength = arrayData.length;
		arrayLength = arrayLength - 1;
        let saveCitiesAndStates = await cityStateController.saveCitiesAndStates(arrayData,arrayLength,j);
        if(saveCitiesAndStates){
            response.success = true;
            response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        }else{
            response.success = false;
            response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
        }
        return res.status(200).send(response);
    });
});

router.get("/get-all-states",[authetication.not_required_authentication], function (req, res, next) {
    return Bluebird.try(async() => {
      let postData = req.body;
      let response = {success:false};
      let getAllStates = await cityStateController.getAllStates(postData);
      if(getAllStates.length>0){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.data = getAllStates;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
      return res.status(200).send(response);
    });
});

router.post("/get-cities-by-state-ids",[authetication.not_required_authentication], function (req, res, next) {
    return Bluebird.try(async() => {
      let postData = req.body;
      let response = {success:false};
      let getCitiesbyStateIds = await cityStateController.getCitiesbyStateIds(postData);
      if(getCitiesbyStateIds.length>0){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.data = getCitiesbyStateIds;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
      return res.status(200).send(response);
    });
});

module.exports = router;