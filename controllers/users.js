"use strict";

const Bluebird = require("bluebird"); 
const AdminModel = require("../models/admin_master");
const UsersModel = require("../models/users");
const constants = require("../utils/constants");
const utils = require("../utils/utils");
const crypto = require('crypto');
const mongodb = require('mongodb');
const subscriptionsModel = require("../models/subscriptions");
const carsModel = require("../models/cars");
const ratingAndReviewModel = require("../models/rating_and_review");
const userSubscriptionLogsModel = require("../models/user_subscription_logs");
const path = require("path");
const bcrypt  = require('bcrypt-nodejs');
const moment     = require('moment');
const CarEnquiryModel = require("../models/car_enquiry_mails");
const OrdersModel = require("../models/orders");
const paymentsModel = require("../models/payments");
const EmailController = require("../controllers/email");
const commonFunctionController = require("../controllers/common_functions");

// const createNewUser = function (UserData) {
//   return Bluebird.try(() => { 
//     UserData.password = utils.encryptStringCrypt(UserData.password);
//     let User = new UsersModel(UserData);
//     return User.save()
//     .then((isSaved)=>{    
//       return UsersModel.findById(isSaved._id).lean();
//     });
//   }).catch((error) => {   
//     console.error(error);
//     return error;
//   });
// };

const createNewUser =  function (UserData) {
  return Bluebird.try(async() => { 
    let password = UserData.password;
    var salt = await  bcrypt.genSaltSync(10);
    var hash = await bcrypt.hashSync(password, salt);
    delete UserData.password;
    UserData.local = {
      password:hash
    };
    let User = new UsersModel(UserData);
    return User.save()
    .then((isSaved)=>{    
      return UsersModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const verifyUser = function(userId){
  return Bluebird.try(async() => {
   let checkUserStatus = await UsersModel.findById(userId).lean();
    if (checkUserStatus) {
      if (checkUserStatus.status == 'not_verified') {
        let updateStatus  = {};
        updateStatus.status = 'active';
        let verifyUserAccount = await UsersModel.findOneAndUpdate({_id:userId},{$set:updateStatus},{new:true}).lean();
        return verifyUserAccount;
      }else{
        console.log(checkUserStatus.status);
        let returnData = {};
        returnData.error = checkUserStatus.status;
        return returnData;
      }
    }else{
      return false;
    }
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const checkUserEmailExists = function(email){
  return Bluebird.try(async() => {
    email = new RegExp(email, "i");
    let userInfo = await UsersModel.findOne({email:email}).lean();
    console.log("userInfo",userInfo);
    return userInfo;
  }).catch((error) => {   
      console.error(error);
      return error;
  });
};

const checkRandomStringExist = function(RandomString){
  return Bluebird.try(async() => {
    let userInfo = await UsersModel.findOne({forgot_password_str:RandomString}).lean();
    return userInfo;
  }).catch((error) => {   
      console.error(error);
      return error;
  });
};



const testSearch = function(email){
  return Bluebird.try(async() => {
    let pushIds = [];

    // let finUsers = await UsersModel.find( { $or: [ {"fullname":{$regex:".*akshay.*",$options:'i'}}, {"email":{$regex:".*chetan.devstree12321111@gmail.com.*",$options:'i'}} ] } ).select('_id').lean()
    // return Bluebird.map(finUsers, async function (row) {
    //   pushIds.push(row._id);
    //   return row;
    // }).then(async(returnData) => {
    //   console.log("findCars  :",pushIds);
    //   let carList = await carsModel.find( { creator: { $in: pushIds } } );
    //   console.log(carList.length);
    //   return carList;
    // });
  }).catch((error) => {   
      console.error(error);
      return error;
  });
};

const findUserById = function(user_id){
  return Bluebird.try(async() => {
    let userInfo = await UsersModel.findById(user_id).lean();
    return userInfo;
  }).catch((error) => {   
      console.error(error);
      return error;
  });
};

const getDealerProfile = function(dealer_id){
  return Bluebird.try(async() => {
    let returnArray = {};
    let DealerInfo = await UsersModel.findById(dealer_id).select('-local').lean();
    if (DealerInfo) {

      if (DealerInfo.avatarurl && DealerInfo.avatarurl != '') {
        DealerInfo.avatarurl = process.env.SITE_URL+"user-images/"+DealerInfo.avatarurl;
      }else{
        DealerInfo.avatarurl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.USER_PLACEHOLDER;
      }
      if (DealerInfo.logourl && DealerInfo.logourl != '') {
        DealerInfo.logourl = process.env.SITE_URL+"user-images/"+DealerInfo.logourl;
      }else{
        DealerInfo.logourl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.DEFAUT_PLACEHOLDER;
      }
      if(!DealerInfo.businessname){
        DealerInfo.businessname = '';
      }
      let DealerRatingReviews = await ratingAndReviewModel.find({seller:dealer_id}).populate("user","fullname").lean();
      let getRating = await getSellerRating(DealerInfo._id);
      returnArray.dealer_info = DealerInfo;
      returnArray.ratings_and_reviews = DealerRatingReviews;
      returnArray.ratings = getRating;
      return returnArray;
    }else{
      return false;
    }
  }).catch((error) => {   
      console.error(error);
      return error;
  });
};

const checkEmailExistsForUpdateUser = function(user_id,email){
  return Bluebird.try(async() => {
    let userInfo = await UsersModel.findOne({$and: [{email:email},{'_id': {$ne : new mongodb.ObjectId(user_id)}}]}).lean();
    return userInfo;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const checkUserNameExistsForUpdateUser = function(user_id,username){
  return Bluebird.try(async() => {
    let userInfo = await UsersModel.findOne({$and: [{username:username},{'_id': {$ne : new mongodb.ObjectId(user_id)}}]}).lean();
    return userInfo;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const updatedDetails = function(userId,data){
  return Bluebird.try(async() => {
    return UsersModel.findOneAndUpdate({_id:userId},{$set:data},{new:true}).lean();
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const updateUser = function(id,update){
  return Bluebird.try(async() => {
    let updateUserDetails = await  UsersModel.findByIdAndUpdate(id, update, { multi: true }).lean();
    return updateUserDetails;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const updateOrder = function(id,update){
  return Bluebird.try(async() => {
    let updateOrderData = await  OrdersModel.findByIdAndUpdate(id, update, { multi: true }).lean();
    return updateOrderData;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};




const pushOldSubscToHistory = function(userId,Oldsubscription){
  return Bluebird.try(async() => {
    return UsersModel.findOneAndUpdate({_id:userId},{$push:{histories:Oldsubscription}},{new:true}).lean();
  }).catch((error) => {
    console.error(error);
    return error;
  });
};




const updateUserImages = function(){
  return Bluebird.try(async() => {
    let UserList = await  UsersModel.find({}).lean();
    return Bluebird.map(UserList, async function (row) {
      let updateUserData = {};
      if(row.logourl && row.logourl != ''){
        updateUserData.logourl = path.basename(row.logourl);
      }else{
        updateUserData.logourl = '';
      }
      if (row.avatarurl && row.avatarurl != '') {
        updateUserData.avatarurl = path.basename(row.avatarurl);
      }else{
        updateUserData.avatarurl = 'avatar.png';
      }
      let returnUpdatedData = await updatedDetails(row._id,updateUserData);
      return returnUpdatedData;
    }).then(async(returnData) => {
      return returnData;
    });
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const getFreeSubscription = function(){
  return Bluebird.try(async() => {
    let getSubscription = await subscriptionsModel.findOne({price : 0}).lean();
    return getSubscription;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const getSubscriptionById = function(sub_id){
  return Bluebird.try(async() => {
    let getSubscription = await subscriptionsModel.findById(sub_id).lean();
    console.log("getSubscription",getSubscription);
    return getSubscription;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};


const addUserSubscriptionLog = function(subData){
  return Bluebird.try(async() => {
    let saveSubscriptionData = new userSubscriptionLogsModel(subData);
    return saveSubscriptionData.save()
    .then((isSaved)=>{    
      return userSubscriptionLogsModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const getMySubscriptionHistory = function(user_id){
  return Bluebird.try(async() => {   
      return userSubscriptionLogsModel.find({creator:user_id}).populate('creator subs_id','name title fullname email').lean();
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const updateSubAmount = function(userId){
  return Bluebird.try(async() => {
    return UsersModel.findOneAndUpdate({_id:userId},{$inc:{'subscriptions.0.amount' : -1}},{new:true}).lean();
  }).catch((error) => {
    console.error(error);
    return error;
  });
};


const getDealerList = function (postData) {
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
    let currentime = moment().format("X");
    if(postData.search && postData.search != ''){
      let regex = new RegExp(postData.search, "i");
      query    = { $and: [ {'subscriptions.0.expirytimes': {$gt: currentime}}, {'subscriptions.0.type': 'paid'}, {'subscriptions.0.status': 'active'}, 
      { $or: [{ fullname: regex }, { gsm: regex },{ province: regex },{ city: regex },{ email: regex },{ businessname: regex },{ businessAddress: regex }]}
      ]};
      arranger = { arranger : -1 };
    }else{
      query = {$and:[{'subscriptions.0.expirytimes': {$gt: currentime}}, {'subscriptions.0.type': 'paid'}, {'subscriptions.0.status': 'active'}]};
    }

    let countTotalDealer = await UsersModel.find(query).sort(arranger).countDocuments().lean();

    let DealerList = await UsersModel.find(query).select("fullname email logourl avatarurl mobile_number address city businessname businessAddress gsm").sort(arranger).skip(skip).limit(limit).lean();
    return Bluebird.map(DealerList, async function (row) {

      if (row.avatarurl && row.avatarurl != '') {
        row.avatarurl = process.env.SITE_URL+"user-images/"+row.avatarurl;
      }else{
        row.avatarurl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.USER_PLACEHOLDER;
      }
      if (row.logourl && row.logourl != '') {
        row.logourl = process.env.SITE_URL+"user-images/"+row.logourl;
      }else{
        row.logourl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.DEFAUT_PLACEHOLDER;
      }
      let countTotalCars = await carsModel.find({creator:row._id}).countDocuments().lean();
      row.total_cars = countTotalCars;
      let getRating = await getSellerRating(row._id);
      row.average_rating = getRating.average_rating;
      row.total_reviews = getRating.total_reviews;
      return row;
    }).then(async(returnData) => {
      let returnArray = {};
      returnArray.list = returnData;
      returnArray.totalCount = countTotalDealer;
      return returnArray;
    });
  }).catch((error) => {
    console.error(error);
  });
};
const getUserDealerCount = function (postData) {
  return Bluebird.try(async() => {
    let countTotalDealer = await UsersModel.countDocuments().lean();
    let returnArray = {};
    returnArray.totalCount = countTotalDealer;
    return returnArray;
  }).catch((error) => {
    console.error(error);
  });
};
const getSellerRating = function (seller_id) {
  return Bluebird.try(async() => {
    let returnData = {};
    let ratingData = await ratingAndReviewModel.aggregate([
      { $match : { seller : seller_id } },
      {
        $group : {
           _id : { seller:seller_id },
           averageRating: { $avg: "$rating" },
           totalCount: { $sum: 1 }
        },
      }
     ]);
     if (ratingData.length>0) {
      returnData.average_rating = ratingData[0].averageRating;
      returnData.total_reviews = ratingData[0].totalCount;
     }else{
      returnData.average_rating = 0;
      returnData.total_reviews = 0;
     }
     return returnData;
  }).catch((error) => {
    console.error(error);
  });
};

const addRatingAndReview = function (postData) {
  return Bluebird.try(() => { 
    let saveData = new ratingAndReviewModel(postData);
    return saveData.save()
    .then((isSaved)=>{    
      return ratingAndReviewModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};


const saveEnquiryMail = function (enquiryData) {
  return Bluebird.try(() => { 
    let saveData = new CarEnquiryModel(enquiryData);
    return saveData.save()
    .then((isSaved)=>{    
      return CarEnquiryModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const applyOrder = function (orderData) {
  return Bluebird.try(() => { 
    let saveData = new OrdersModel(orderData);
    return saveData.save()
    .then((isSaved)=>{    
      return OrdersModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const savePaymentData = function (paymentData) {
  return Bluebird.try(() => { 
    let saveData = new paymentsModel(paymentData);
    return saveData.save()
    .then((isSaved)=>{    
      return paymentsModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};


const getSubscribers = function ()  {
  return Bluebird.try(async() => {
    let currentime = moment().format("X");
    let subscribers = await  UsersModel.find({ $and:[ {admin:{$exists: false}}, {'subscriptions.0.expirytimes': {$gt: currentime}},
     {'subscriptions.0.type': 'paid'}, {'subscriptions.0.status': 'active'}]}).select("_id").sort({arranger : -1});
    return subscribers;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getSubscribersByLocation = function (data)  {
  return Bluebird.try(async() => { 
    let currentime = moment().format("X"), query;
    if (data.province && data.city) {
        query = { $and:[ 
            { admin:{ $exists: false} }, 
            { 'subscriptions.0.expirytimes': { $gt: currentime }}, 
            { 'subscriptions.0.type': 'paid' }, 
            { 'subscriptions.0.status': 'active' },
            { province: { $in : data.province  } },
            { city: { $in : data.city  }}
        ]}
    } else if(data.province) {
        query = { $and:[ 
            { admin:{ $exists: false} }, 
            { 'subscriptions.0.expirytimes': { $gt: currentime }}, 
            { 'subscriptions.0.type': 'paid' }, 
            { 'subscriptions.0.status': 'active' },
            { province: { $in : data.province  } }
        ]}
    } else if(data.city) {
        query = { $and:[ 
            { admin:{ $exists: false} }, 
            { 'subscriptions.0.expirytimes': { $gt: currentime }}, 
            { 'subscriptions.0.type': 'paid' }, 
            { 'subscriptions.0.status': 'active' },
            { city: { $in : data.city  } }
        ]}
    } else {
        query = { $and:[ 
            { admin:{ $exists: false} }, 
            { 'subscriptions.0.expirytimes': { $gt: currentime }}, 
            { 'subscriptions.0.type': 'paid' }, 
            { 'subscriptions.0.status': 'active' }
        ]}
    }
    let subscribers = await UsersModel.find(query).sort({arranger : -1});
    return subscribers;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getAllActiveUsers = function (data)  {
  return Bluebird.try(async() => { 
    let query;
    if(data.creator && data.creator != ''){
      query = { $and:[ { _id: data.creator }]};
    }else{
      query = { $and:[ 
        { admin:{ $exists: false} },{ status: 'active' }
      ]};
    }
    if(data.city && data.city != ''){
      query.city = { $in : data.city  };
    }
    if(data.province && data.province != ''){
      query.province = { $in : data.province  };
    }
    let activeUsers = await UsersModel.find(query).sort({arranger : -1});
    return activeUsers;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getAllUsers = function (data)  {
  return Bluebird.try(async() => { 
    let query = {};
    if(data.city && data.city != ''){ query.city = { $in : data.city  };}
    if(data.province && data.province != ''){ query.province = { $in : data.province  };}
    let UsersList = await UsersModel.find(query).sort({arranger : -1});
    return UsersList;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getMyOrders = function (userid) {
  return Bluebird.try(async() => { 
    console.log("userid",userid);
    let getMyOrderList = await  OrdersModel.find({creator:userid}).lean();
    return getMyOrderList;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const GetOrderDetails = function (orderid) {
  return Bluebird.try(async() => { 
    let getMyOrderDetails = await  OrdersModel.findById(orderid).lean();
    return getMyOrderDetails;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};


const cancelMyOrder = function (orderid) {
  return Bluebird.try(async() => { 
    let removeOrder = await OrdersModel.remove({_id:orderid});
    return removeOrder;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const deletePendingSubscriptionOrder = function (user) {
  return Bluebird.try(async() => { 
    let removeOrder = await OrdersModel.remove({creator:user._id,status:"pending",sub:{$exists:true}});
    return removeOrder;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};


const commitDealershipOrder = function(userId){
  return Bluebird.try(async() => {
    return UsersModel.findOneAndUpdate({_id:userId},{$inc:{'subscriptions.0.amount' : -1}},{new:true}).lean();
  }).catch((error) => {
    console.error(error);
    return error;
  });
};


const commitUserSubscription = function(orderid){
  return Bluebird.try(async() => {

    let order = await GetOrderDetails(orderid);

    // {
		// 	"name" : "Gold Package",
		// 	"title" : "Gold Package",
		// 	"amount" : 1046,
		// 	"price" : 5000,
		// 	"duration" : 1,
		// 	"startcdate" : "2020-02-08",
		// 	"expirycdate" : "2020-03-08",
		// 	"starttimes" : "1581172652",
		// 	"expirytimes" : "1583678252",
		// 	"status" : "renewed",
		// 	"type" : "renewed",
		// 	"price " : 2500
		// }

    if (order) {
      let userid      = order.creator;
      let subname     = order.sub.subname;
      let subtitle    = order.sub.title || 'Untitled';
      let amount      = order.sub.amount;
      let duration    = parseInt(order.sub.duration);
      let price       = order.sub.price;

      let startDate   = moment();
      let expiryDate  = await commonFunctionController.addRealMonth(startDate, duration);

      let startCDate  = startDate.format('YYYY-MM-DD');
      let expiryCDate = expiryDate.format('YYYY-MM-DD');

      let startTimes  = startDate.format("X");
      let expiryTimes = expiryDate.format("X");

      let user = await findUserById(userid);

      let history    = user.subscriptions[0];

      history.status = 'renewed';
      history.type   = 'renewed';

      let update = await createQuery(order,history,subname,subtitle,amount,duration,price,startCDate,expiryCDate,startTimes,expiryTimes,user);

        let updateUserData = await updateUser(userid, update);
        if (updateUserData) {
          let updateOrderData = await updateOrder(orderid, { $set: { status : 'completed'}});
          if (updateOrderData) {
            //HomeModel.updateOrder(orderid, { $set: { status : 'completed'}}, rs => {
            let mailOptions = {
                from: '"Chat2Cars" <'+constants.SITE_EMAIL_ADDRESS+'>', // sender address
                //to: user.email,    // list of receivers , aliyuaminu14@gmail.com
                to: 'akshay.devstree@gmail.com',
                subject: 'Your Chat2Cars order from '+startCDate+' is complete', // Subject line
                html: 'Hi '+user.fullname+',<br><br> Your recent order on Chat2Cars is completed. <br><br>Thank you.' // html body
            };
            let sendSUbscriptionMail = await EmailController.sendSubscriptionOrderEmail(mailOptions);
            updateOrderData = await GetOrderDetails(orderid);
            return updateOrderData;
          }else{
            return false;
          }
        }else{
          return false;
        }
    }else{
      return false;
    }
  //  return UsersModel.findOneAndUpdate({_id:userId},{$inc:{'subscriptions.0.amount' : -1}},{new:true}).lean();
  }).catch((error) => {
    console.error(error);
    return error;
  });
};


const createQuery = function(order,history,subname,subtitle,amount,duration,price,startCDate,expiryCDate,startTimes,expiryTimes,user){
  return Bluebird.try(async() => {
    if (order.sub && order.sub.sub_type && order.sub.sub_type == 'dealership') {
      let update  = { $set: {
        'dealership.name'        : subname,
        'dealership.title'       : subtitle,
        'dealership.amount'      : (amount*parseInt(duration)),
        'dealership.price'       : price*parseInt(duration),
        'dealership.duration'    : parseInt(duration),
        'dealership.startcdate'  : startCDate,
        'dealership.expirycdate' : expiryCDate,
        'dealership.starttimes'  : startTimes,
        'dealership.expirytimes' : expiryTimes,
        'dealership.status'      : 'active',
        'dealership.type'        : 'paid'
      } };
      if (user.dealership) {
        update.$push  = {histories : user.dealership};
        return update;
      }else{
        return update;
      }
    }else{
      let update     = { $set: {
          'subscriptions.0.name'        : subname,
          'subscriptions.0.title'       : subtitle,
          'subscriptions.0.amount'      : (amount*parseInt(duration))+history.amount,
          'subscriptions.0.price'       : price*parseInt(duration),
          'subscriptions.0.duration'    : parseInt(duration),
          'subscriptions.0.startcdate'  : startCDate,
          'subscriptions.0.expirycdate' : expiryCDate,
          'subscriptions.0.starttimes'  : startTimes,
          'subscriptions.0.expirytimes' : expiryTimes,
          'subscriptions.0.status'      : 'active',
          'subscriptions.0.type'        : 'paid'
      }, $push : { histories : history } };
      return update
    }
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const getDealershipList = function(){
  return Bluebird.try(async() => {
    let currentime = moment().format("X");
    let dealershipList = await  UsersModel.find({ $and:[ {admin:{$exists: false}}, 
      { dealership: { $exists: true}, 'dealership.expirytimes': {$gt: currentime},
      'dealership.type': 'paid', 'dealership.status': 'active'}
    ]}).select('fullname avatarurl').sort({arranger : -1});
    return Bluebird.map(dealershipList, async function (row) {
      if (row.avatarurl && row.avatarurl != '') {
        row.avatarurl = process.env.SITE_URL+"user-images/"+row.avatarurl;
      }else{
        row.avatarurl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.USER_PLACEHOLDER;
      }
      return row;
    }).then(async(returnData) => {
      return returnData;
    });
  }).catch((error) => {
    console.error(error);
    return error;
  });
};


const updateAllUserEmail = function(){
  return Bluebird.try(async() => {
    let currentime = moment().format("X");
    let userList = await  UsersModel.find({}).lean();
    return Bluebird.map(userList, async function (row) {
      let updateArray = {
        email : row.email.toLowerCase()
      };
     let updateData = await updatedDetails(row._id,updateArray);
      return updateData;
    }).then(async(returnData) => {
      return returnData;
    });
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const updateAllOrderEmails = function(){
  return Bluebird.try(async() => {
    let currentime = moment().format("X");
    let orderList = await  OrdersModel.find({}).lean();
    return Bluebird.map(orderList, async function (row) {
      let updateArray = {
        email : row.email.toLowerCase()
      };
     let updateData = await  OrdersModel.findOneAndUpdate({_id:row._id},{$set:updateArray},{new:true}).lean();
      return updateData;
    }).then(async(returnData) => {
      return returnData;
    });
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const getMyCarsEnquiry = function(postData){
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
    let queryDb = {};
    if(postData.search && postData.search != ''){
      let regex = new RegExp(postData.search, "i");
      queryDb["$or"] = [{ name: regex }, { email: regex },{ gsm: regex },{ message: regex }];
    }
    queryDb["dealer_id"] = postData.userid;
    let enquiryList = await CarEnquiryModel.find(queryDb).populate('car_id','featured_image make model title slug _id').sort(arranger).skip(skip).limit(limit).lean();
    let enquiryListCount = await CarEnquiryModel.find(queryDb).countDocuments().lean();
    

    return Bluebird.map(enquiryList, async function (row) {

      if(row.car_id && row.car_id != null){

        if (row.car_id.featured_image && row.car_id.featured_image != '') {
          row.featured_image = process.env.SITE_URL+"cars-images/"+row.car_id.featured_image;
        }else{
          row.featured_image = process.env.SITE_URL+""+constants.PLACE_HOLDER_IMAGES.CARS_PLACEHOLDER;
        }
  
        var created_at = new Date(row.created_at);
        var date = created_at.getDate();
        var month = created_at.getMonth() + 1; // Since getMonth() returns month from 0-11 not 1-12
        var year = created_at.getFullYear();
        row.date = date + "-" + month + "-" + year;
        row.time = created_at.toLocaleTimeString();

        console.log("row : ",row);
  
       return row;

      }

      
    }).then(async(returnData) => {


      var FilterData = returnData.filter(function (el) {
        return el != null;
      });

      let returnArray = {};
      returnArray.list = FilterData;
      returnArray.totalCount = enquiryListCount;
      return returnArray;
    });
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

module.exports = {
  createNewUser:createNewUser,
  checkUserEmailExists:checkUserEmailExists,
  findUserById:findUserById,
  checkEmailExistsForUpdateUser:checkEmailExistsForUpdateUser,
  updatedDetails:updatedDetails,
  checkUserNameExistsForUpdateUser:checkUserNameExistsForUpdateUser,
  getFreeSubscription:getFreeSubscription,
  getSubscriptionById:getSubscriptionById,
  getDealerList:getDealerList,
  getUserDealerCount:getUserDealerCount,
  addRatingAndReview:addRatingAndReview,
  getSellerRating:getSellerRating,
  getDealerProfile:getDealerProfile,
  verifyUser:verifyUser,
  addUserSubscriptionLog:addUserSubscriptionLog,
  getMySubscriptionHistory:getMySubscriptionHistory,
  testSearch:testSearch,
  checkRandomStringExist:checkRandomStringExist,
  saveEnquiryMail:saveEnquiryMail,
  getSubscribersByLocation:getSubscribersByLocation,
  getSubscribers:getSubscribers,
  updateUserImages:updateUserImages,
  pushOldSubscToHistory:pushOldSubscToHistory,
  applyOrder:applyOrder,
  updateSubAmount:updateSubAmount,
  updateUser:updateUser,
  savePaymentData:savePaymentData,
  getMyOrders:getMyOrders,
  cancelMyOrder:cancelMyOrder,
  GetOrderDetails:GetOrderDetails,
  updateOrder:updateOrder,
  deletePendingSubscriptionOrder:deletePendingSubscriptionOrder,
  commitDealershipOrder:commitDealershipOrder,
  commitUserSubscription:commitUserSubscription,
  createQuery:createQuery,
  getDealershipList:getDealershipList,
  updateAllUserEmail:updateAllUserEmail,
  updateAllOrderEmails:updateAllOrderEmails,
  getMyCarsEnquiry:getMyCarsEnquiry,
  getAllActiveUsers:getAllActiveUsers,
  getAllUsers:getAllUsers
};