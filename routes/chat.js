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

const ChatController = require("../controllers/chat");


router.post("/save-chat-info",[authetication.authenticate], function (req, res, next) {
    return Bluebird.try(async() => {
      let postData = req.body;
      let response = {success:false};
      if(postData.reciever && postData.reciever != ''){
        postData.sender = req.user._id;
        let saveChatData = await ChatController.saveChatData(postData);
        if(saveChatData){
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
          response.data = saveChatData;
        }else{
          response.success = false;
          response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
        }
      }else{
        response.success = false;
        response.msg = 'Reciever account not found, Please try again';
      }
      return res.status(200).send(response);
    });
  });

  router.get("/my-chat-list",[authetication.authenticate], function (req, res, next) {
    return Bluebird.try(async() => {
      let postData = req.body;
      let response = {success:false};
      let myCarList = await ChatController.myChat(req.user._id);
      if(myCarList.length>0){
        response.success = true;
        response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
        response.data = myCarList;
      }else{
        response.success = false;
        response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
      }
      return res.status(200).send(response);
    });
  });


module.exports = router;