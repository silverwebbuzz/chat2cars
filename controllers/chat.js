"use strict";

const Bluebird = require("bluebird"); 
const AdminModel = require("../models/admin_master");
const UsersModel = require("../models/users");
const constants = require("../utils/constants");
const utils = require("../utils/utils");
const crypto = require('crypto');
const mongodb = require('mongodb');
const chatModel = require("../models/chat_model");


const saveChatData = function (postData) {
    return Bluebird.try(async() => { 
    let checkExist = await chatModel.findOne({sender:postData.sender,reciever:postData.reciever}).lean();
    if (checkExist) {
        let updateChatData = {};
        updateChatData.arranger = Date.now();
        let updateData = await chatModel.findOneAndUpdate({_id:checkExist._id},{$set:updateChatData},{new:true}).lean();
        return updateData;
    }else{
        let saveData = new chatModel(postData);
        return saveData.save()
        .then((isSaved)=>{    
            return chatModel.findById(isSaved._id).populate('sender reciever','fullname email gsm').lean();
        });
    }
    }).catch((error) => {   
      console.error(error);
      return error;
    });
  };

  const myChat = function (userid) {
    return Bluebird.try(async() => { 
    let arranger = { arranger : -1 };
    let myChatList = await chatModel.find({$or: [ { sender: userid }, { reciever: userid } ]}).populate('sender reciever','fullname email gsm avatarurl').sort(arranger).lean();
    
    return Bluebird.map(myChatList, async function (row) {

      if (row.sender.avatarurl && row.sender.avatarurl != '') {
        row.sender.avatarurl = process.env.SITE_URL+"user-images/"+row.sender.avatarurl;
      }else{
        row.sender.avatarurl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.USER_PLACEHOLDER;
      }

      if (row.reciever.avatarurl && row.reciever.avatarurl != '') {
        row.reciever.avatarurl = process.env.SITE_URL+"user-images/"+row.reciever.avatarurl;
      }else{
        row.reciever.avatarurl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.USER_PLACEHOLDER;
      }

      return row;
    }).then(async(returnData) => {
      return returnData;
    });
    return myChatList;
    }).catch((error) => {   
      console.error(error);
      return error;
    });
  };

module.exports = {
    saveChatData:saveChatData,
    myChat:myChat
};