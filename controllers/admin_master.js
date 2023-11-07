"use strict";

const Bluebird = require("bluebird"); 
const adminModel = require("../models/admin_master");
const UsersModel = require("../models/users");
const constants = require("../utils/constants");
const utils = require("../utils/utils");
const crypto = require('crypto');
const mongodb = require('mongodb');
const commonFunctionController = require("../controllers/common_functions");
const subscriptionsModel = require("../models/subscriptions");
const CarBrandModel = require("../models/car_brands");
const CarModelsModel = require("../models/car_models");
const CarTypesModel = require("../models/car_types");
const MakesModel = require("../models/makes");
const blogsModel = require("../models/blogs");
const YearsModel = require("../models/years");
const carsModel = require("../models/cars");
const testDriveModel = require("../models/test_drive");
const ContactUsModel = require("../models/contact_us");
const ratingAndReviewModel = require("../models/rating_and_review");
const bcrypt  = require('bcrypt-nodejs');

const createNewAdmin = function (adminData) {
  return Bluebird.try(async() => { 
    // encrypting the password Before Saving in SSH
    //adminData.password = utils.encryptStringCrypt(adminData.password);
   
    var salt = await  bcrypt.genSaltSync(10);
    var hash = await bcrypt.hashSync(adminData.password, salt);
    adminData.password = hash;

    adminData.admin = { 
      username:adminData.username,
      password:adminData.password
    };

    adminData.local = {
      password:adminData.password
    }

    delete adminData.username;
    delete adminData.password;

    console.log(adminData.password);
    let admin = new UsersModel(adminData);
    return admin.save()
    .then((isSaved)=>{    
      return UsersModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const updateAdminProfile = function(admin_id,postData){
  return Bluebird.try(async() => {
    let updateAdmin = await UsersModel.findOneAndUpdate({_id:admin_id},{$set:postData},{new:true}).lean();
    return updateAdmin;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const updateAdminDetails = function (id, data) {
  return Bluebird.try(async() => {
    return UsersModel.findOneAndUpdate({ _id: id }, {
      $set: data
    }, { new: true })
    .then((isUpdatedDetail)=>{
      return findAdminById(id);
    });
  }).catch((error) => {
    console.error(error);
  });
};

const checkAdminEmailExists = function(adminId,email){
 return Bluebird.try(async() => {
    let adminInfo = await UsersModel.findOne({$and: [{email:email},{'_id': {$ne : new mongodb.ObjectId(adminId)}}]}).lean();
    return adminInfo;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const checkEmailExists = function(email){
 return Bluebird.try(async() => {
    let adminInfo = await UsersModel.findOne({email:email}).lean();
    return adminInfo;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const checkUserNameExists = function(username){
  return Bluebird.try(async() => {
     let adminInfo = await UsersModel.findOne({'admin.username':username}).lean();
     return adminInfo;
   }).catch((error) => {
     console.error(error);
     return error;
   });
 };

const findAdminById = function (AdminId) {
  return Bluebird.try(() => {
    return UsersModel.findOne({_id:AdminId}).lean();
  }).catch((error) => {
    console.error(error);
  });
};

const findAdminByEmailOrUsername = function(email){
  return Bluebird.try(async() => {
    let userInfo = await UsersModel.findOne({$or:[{'admin.username':email}]});
    console.log("username : ",userInfo);
    if(userInfo != null){
      return userInfo;
    }else{
      return false;
    }
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const deleteSingleUser = function (user_id) {
  return Bluebird.try(async() => {
    let deleteUser = await UsersModel.remove({_id:user_id});
    console.log(deleteUser);
    return true;
    //return usersList;
  }).catch((error) => {
    console.error(error);
  });
};

const getUsersList = function (postData) {
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
    query["$and"] = [ {admin:{$exists: false}},{type:'user'}];

    if(postData.search && postData.search){
      let regex = new RegExp(postData.search, "i");
      query["$or"] = [{ fullname: regex }, { email: regex }, { gsm: regex },{ businessname: regex }];
    }

    let countTotalUsers = await UsersModel.find(query).sort(arranger).countDocuments().lean();
    let UserList = await UsersModel.find(query).sort(arranger).skip(skip).limit(limit).lean();
    let returnArray = {};
    returnArray.list = UserList;
    returnArray.totalCount = countTotalUsers;
    return returnArray;
  }).catch((error) => {
    console.error(error);
  });
};

const getTechniciansList = function (postData) {
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
    
    query["$and"] = [ {admin:{$exists: false}},{type:'technician'}];
//{category:{$ne:'user'}}
    if(postData.search && postData.search){
      let regex = new RegExp(postData.search, "i");
      query["$or"] = [{ fullname: regex }, { email: regex }, { gsm: regex },{ businessname: regex }];
    }

    let countTotalUsers = await UsersModel.find(query).sort(arranger).countDocuments().lean();
    let UserList = await UsersModel.find(query).sort(arranger).skip(skip).limit(limit).lean();
    let returnArray = {};
    returnArray.list = UserList;
    returnArray.totalCount = countTotalUsers;
    return returnArray;
  }).catch((error) => {
    console.error(error);
  });
};

const addSubscription = function (postData) {
  return Bluebird.try(() => { 
    let saveSubscription = new subscriptionsModel(postData);
    return saveSubscription.save()
    .then((isSaved)=>{    
      return subscriptionsModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const updateSubscription = function (postData,sub_id) {
  return Bluebird.try(async() => { 
    let updatedData = await subscriptionsModel.findOneAndUpdate({_id:sub_id},{$set:postData},{new:true}).lean();
    return updatedData;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getSubscriptionList = function () {
  return Bluebird.try(async() => { 
    let subList = await subscriptionsModel.find({}).populate('creator','email fullname').lean();
    return subList;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getSingleSubscriptionData = function (sub_id) {
  return Bluebird.try(async() => { 
    let subDetails = await subscriptionsModel.findById(sub_id).populate('creator','email fullname').lean();
    return subDetails;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const deleteSubscription = function (sub_id) {
  return Bluebird.try(async() => { 
    let deleteSub = await subscriptionsModel.remove({_id:sub_id});
    return true;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const addMake = function (postData) {
  return Bluebird.try(async() => {
    let saveMake = new MakesModel(postData);
    return saveMake.save()
    .then((isSaved)=>{    
      return MakesModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const addYear = function (postData) {
  return Bluebird.try(async() => {
    let saveYear = new YearsModel(postData);
    return saveYear.save()
    .then((isSaved)=>{    
      return YearsModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getAllMakes = function () {
  return Bluebird.try(async () => {
    let makesList = await MakesModel.find({}).select("models creator date  maketitle status").sort({ maketitle: 1 }).lean();
    return Bluebird.map(makesList, async function (row) {
      let returnArray = {};
      // let CountModel = await CarModelsModel.find({brand_id:row._id}).count().lean();
      let singleMake = await MakesModel.findById(row._id).lean();

      returnArray._id = row._id;
      returnArray.creator = row.creator;
      returnArray.date = row.date;
      returnArray.maketitle = row.maketitle;
      returnArray.status = row.status;
      returnArray.count_models = row.models.length;
      returnArray.models = singleMake.models;


      return returnArray;
    }).then(async (returnData) => {
      return returnData;
    });
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const getSingleMake = function (make_id) {
  return Bluebird.try(async() => { 
    let singleMake = await MakesModel.findById(make_id).lean();
    if (singleMake) {
      return singleMake;
    }else{
      return false;
    }
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getAllYears = function () {
  return Bluebird.try(async() => { 
    let YearList = await YearsModel.find({}).select("creator year status date").sort({year : 1}).lean();
    return YearList;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const addMAkeModel = function (query,update) {
  return Bluebird.try(async() => { 
    return MakesModel.findOneAndUpdate(query, update, { multi: true }).then((isUpdated)=>{    
      return MakesModel.findById(isUpdated._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getRatingAndReviewList = function (postData) {
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
    query = { $and: [{}]};
    if ( postData.seller && postData.seller != '' ) { query.seller = postData.seller };
    if ( postData.user && postData.user != '' ) { query.user = postData.user };
    let countTotalList = await ratingAndReviewModel.find(query).sort(arranger).countDocuments().lean();
    let reviewList = await ratingAndReviewModel.find(query).sort(arranger).populate("seller user","_id fullname email mobile_number").skip(skip).limit(limit).lean();
    let returnArray = {};
    returnArray.list = reviewList;
    returnArray.totalCount = countTotalList;
    return returnArray;
  }).catch((error) => {
    console.error(error);
  });
};

const getCarList = function (postData) {
  return Bluebird.try(async() => {
    let limit = 10;
    let skip = 0;
    let query = {};
    let arranger = {arranger : -1};
    if (postData.limit && postData.limit != '') { limit = await parseInt(postData.limit); }

    if (postData.page && postData.page != '') {
      let page = await parseInt(postData.page);
      page = page-1;
      skip = page*limit;
    }

    if ( postData.creator && postData.creator != '' ){ query.creator  = postData.creator;} else{ query.creator = { $in: postData.subscribers }; }

    if ( postData.status && postData.status != '' ){ query.status  = postData.status;}

    if(postData.search && postData.search != ''){
      let regex = new RegExp(postData.search, "i");
      query["$or"] =  [{ title: regex }, { slug: regex }, { bodytype: regex },{ condition: regex },{ fueltype: regex },{ drive: regex },
        { exteriorcolor: regex },{ interiorcolor: regex },{ make: regex },{ model: regex }];
        arranger = { arranger : -1 };
    }

    if (postData.max_price && postData.max_price != '' && postData.min_price && postData.min_price != '') {
        query.price  = { $lte: parseInt(postData.max_price), $gte: parseInt(postData.min_price) };
        arranger = { price : 1 };
    }
    else if (postData.max_price && postData.max_price != '') {
        query.price  =  { $lte: parseInt(postData.max_price) };
        arranger = { price : 1 };
    } else if (postData.min_price && postData.min_price != '') {
        query.price = { $gte: parseInt(postData.min_price) } ;
        arranger = { price : -1 };
    }

    if ( postData.make && postData.make != '' ) { 
      let brandNames = postData.make;
      brandNames = brandNames.split(',');
      query.make = {  $in : brandNames   }
    };

    if ( postData.fueltype && postData.fueltype != '' ) { 
      let fueltype = postData.fueltype;
      fueltype = fueltype.split(',');
      query.fueltype = {  $in : fueltype   }
    };

    if ( postData.transmission && postData.transmission != '' ) { query.transmission = postData.transmission };
    if ( postData.condition && postData.condition != '' )       { query.condition    = postData.condition    };

    if ( postData.sortBy && postData.sortBy != '' )           { 
      if (postData.sortBy == 'price_low_high')         { arranger = { price : 1 }  }
      else if(postData.sortBy == 'price_high_low')     { arranger = { price : -1 }  }
      else if(postData.sortBy == 'year_low_high')      { arranger = { year : 1 }  }
      else if(postData.sortBy == 'year_high_low')      { arranger = { year : -1 }  }
      else if(postData.sortBy == 'mileage_low_high')   { arranger = { mileage : 1 }  }
      else if(postData.sortBy == 'mileage_high_low')   { arranger = { mileage : -1 }  }
      else if(postData.sortBy == 'most_recent')        { arranger = { arranger : -1 }  }
    };

    if ( postData.model && postData.model != '' ) {
      let modelNames = postData.model;
      modelNames = modelNames.split(',');
      query.model = {  $in : modelNames }
    };

    if ( postData.bodytype && postData.bodytype != '' ) {
      let bodytypeNames = postData.bodytype;
      bodytypeNames = bodytypeNames.split(',');
      query.bodytype = {  $in : bodytypeNames }
    };

    if ( postData.year && postData.year != '' ) { 
      let YearArray = postData.year;
      YearArray = YearArray.split(',');
      query.year = { $in : YearArray }
    };

    if (postData.mileage && postData.mileage != '') { query.mileage = await new RegExp(commonFunctionController.escapeRegex(postData.mileage), 'gi')};
    if (postData.address && postData.address != '') { query.address = await new RegExp(commonFunctionController.escapeRegex(postData.address), 'gi')};
  
    let countTotalRecords = await carsModel.find(query).sort(arranger).countDocuments().lean();

    let CarList = await carsModel.find(query).select("_id title slug condition year bodytype mileage fueltype engine transmission price date status featured_image make model creator").sort(arranger).skip(skip).limit(limit).lean();

    return Bluebird.map(CarList, async function (row) {
 
      if (row.featured_image && row.featured_image != '') {
        row.featured_image = process.env.SITE_URL+"cars-images/"+row.featured_image;
      }else{
        row.featured_image = process.env.SITE_URL+"place-holder-images/"+constants.PLACE_HOLDER_IMAGES.CARS_PLACEHOLDER;
      }
      return row;
    }).then(async(returnData) => {
      let returnArray = {};
      returnArray.list = returnData;
      returnArray.totalCount = countTotalRecords;
      return returnArray;
    });
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const dashboardCount = function () {
  return Bluebird.try(async() => { 
    let getUsersCount = await UsersModel.find({}).countDocuments().lean();
    let getCarsCount = await carsModel.find({}).countDocuments().lean();
    let getMakesCount = await MakesModel.find({}).countDocuments().lean();
    let getBlogsCount = await blogsModel.find({}).countDocuments().lean();
    let getContactCount = await ContactUsModel.find({}).countDocuments().lean();
    let getTestDriveCount = await testDriveModel.find({}).countDocuments().lean();
    let countModel = await MakesModel.aggregate(
      [{ $match: { _id: {$ne:""} }},{ $group: { _id: "$_id", total: { $sum: { $size: "$models"} } } }]
    );
    let totalModels = 0;
    countModel.forEach(makesModel => {
      totalModels = totalModels+makesModel.total;
    });

    let returnArray = {
      users_count     : getUsersCount,
      cars_count      : getCarsCount,
      makes_count     : getMakesCount,
      models_count    : totalModels,
      blogs_count     : getBlogsCount,
      contacts_count  : getContactCount,
      testdrive_count : getTestDriveCount
    };
    return returnArray;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};


const createQueryForSubsciption = function (sub,duration,startCDate,expiryCDate,startTimes,expiryTimes,history) {
  return Bluebird.try(async() => { 
    if (sub.sub_type && sub.sub_type == 'dealership') {
      let update  = { $set: {
        'dealership.name'        : sub.name,
        'dealership.title'       : sub.title,
        'dealership.amount'      : (sub.number*parseInt(duration)),
        'dealership.price'       : sub.price*parseInt(duration),
        'dealership.duration'    : parseInt(duration),
        'dealership.startcdate'  : startCDate,
        'dealership.expirycdate' : expiryCDate,
        'dealership.starttimes'  : startTimes,
        'dealership.expirytimes' : expiryTimes,
        'dealership.status'      : 'active',
        'dealership.type'        : 'paid'
      }, $push : { histories : history } };
      return update;
    }else{
      let update     = { $set: {
        'subscriptions.0.name'        : sub.name,
        'subscriptions.0.title'       : sub.title,
        'subscriptions.0.amount'      : (sub.number*parseInt(duration))+history.amount,
        'subscriptions.0.price'      : sub.price*parseInt(duration),
        'subscriptions.0.duration'    : parseInt(duration),
        'subscriptions.0.startcdate'  : startCDate,
        'subscriptions.0.expirycdate' : expiryCDate,
        'subscriptions.0.starttimes'  : startTimes,
        'subscriptions.0.expirytimes' : expiryTimes,
        'subscriptions.0.status'      : 'active',
        'subscriptions.0.type'        : 'paid'
      }, $push : { histories : history } };

      console.log("update : ",update);
      return update;
    }
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};


module.exports = {
  createNewAdmin:createNewAdmin,
  checkAdminEmailExists:checkAdminEmailExists,
  findAdminById:findAdminById,
  findAdminByEmailOrUsername:findAdminByEmailOrUsername,
  updateAdminProfile:updateAdminProfile,
  updateAdminDetails:updateAdminDetails,
  getUsersList:getUsersList,
  getTechniciansList:getTechniciansList,
  deleteSingleUser:deleteSingleUser,
  addSubscription:addSubscription,
  updateSubscription:updateSubscription,
  getSubscriptionList:getSubscriptionList,
  getSingleSubscriptionData:getSingleSubscriptionData,
  deleteSubscription:deleteSubscription,
  checkEmailExists:checkEmailExists,
  addMake:addMake,
  getAllMakes:getAllMakes,
  getSingleMake:getSingleMake,
  getRatingAndReviewList:getRatingAndReviewList,
  checkUserNameExists:checkUserNameExists,
  addMAkeModel:addMAkeModel,
  addYear:addYear,
  getAllYears:getAllYears,
  getCarList:getCarList,
  dashboardCount:dashboardCount,
  createQueryForSubsciption:createQueryForSubsciption
};

 

