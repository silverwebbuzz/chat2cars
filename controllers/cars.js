"use strict";

const Bluebird = require("bluebird"); 
const UsersModel = require("../models/users");
const constants = require("../utils/constants");
const utils = require("../utils/utils");
const crypto = require('crypto');
const mongodb = require('mongodb');
const commonFunctionController = require("../controllers/common_functions");
const carsModel = require("../models/cars");
const path = require("path");
const url = require("url");
const testDriveModel = require("../models/test_drive");
const makesModel = require("../models/makes");
const usersController = require("../controllers/users");
const moment     = require('moment');
var fs = require('fs');
const im = require('imagemagick');
var Jimp = require('jimp');
const CarTypesModel = require("../models/car_types");

const addCar = function (postData) {
  return Bluebird.try(async() => { 
    let addCars = new carsModel(postData);
    return addCars.save()
    .then((isSaved)=>{    
      return carsModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const ModifyImagesData = function (carsImages) {
  return Bluebird.try(async() => { 
    return Bluebird.map(carsImages, async function (row) {
      let  CarImagesUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.CARS_IMAGES);
      let imagepath = CarImagesUploadDirPath+""+row.filename;
      // im.resize({
      //   srcData: fs.readFileSync(imagepath, 'binary'),
      //   quality: 0.6,
      //   width:   760,
      //   height:  760
      // }, function(err, stdout, stderr){
      //   if (err) throw err
      //   fs.writeFileSync(imagepath, stdout, 'binary');
      // });
      Jimp.read(imagepath, (err, lenna) => {
        if (err) throw err;
        lenna
          .resize(760, 570) // resize
          .quality(60) // set JPEG quality
          .write(imagepath); // save
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

const compressFeaturedImage = function (carsImages) {
  return Bluebird.try(async() => { 
    return Bluebird.map(carsImages, async function (row) {
      let  CarImagesUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.CARS_IMAGES);
      let imagepath = CarImagesUploadDirPath+""+row.filename;
      Jimp.read(imagepath, (err, lenna) => {
        if (err) throw err;
        lenna
          .resize(350, 270) // resize
          .quality(60) // set JPEG quality
          .write(imagepath); // save
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

const attachUrlWithImage = function (imageArray) {
  return Bluebird.try(async() => { 
    return Bluebird.map(imageArray, async function (row) {
      row = process.env.SITE_URL+"cars-images/"+row;
      return row;
    }).then(async(returnData) => {
      return returnData;
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getSingleCarData = function (CarId) {
  return Bluebird.try(async() => { 
    let GetSingleCarData = await carsModel.findById(CarId).populate('creator','address email city subscriptions').lean();
    if (GetSingleCarData) {
      if (GetSingleCarData.featured_image && GetSingleCarData.featured_image != '') {
        GetSingleCarData.featured_image = process.env.SITE_URL+"cars-images/"+GetSingleCarData.featured_image;
      }else{
        GetSingleCarData.featured_image = process.env.SITE_URL+""+constants.PLACE_HOLDER_IMAGES.CARS_PLACEHOLDER;
      }
      let carImageArray = GetSingleCarData.images;
      if (carImageArray.length>0) {
        GetSingleCarData.images = await attachUrlWithImage(GetSingleCarData.images); 
      }
      return GetSingleCarData;
    }else{
      return false;
    }
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getSingleCarDataBySlug = function (carSlug) {
  return Bluebird.try(async() => { 
    let GetSingleCarData = await carsModel.findOne({slug:carSlug}).populate('creator', 'fullname avatarurl _id email gsm subscriptions').lean();
    if (GetSingleCarData) {
      if (GetSingleCarData.featured_image && GetSingleCarData.featured_image != '') {
        GetSingleCarData.featured_image = process.env.SITE_URL+"cars-images/"+GetSingleCarData.featured_image;
      }else{
        GetSingleCarData.featured_image = process.env.SITE_URL+""+constants.PLACE_HOLDER_IMAGES.CARS_PLACEHOLDER;
      }
      let carImageArray = GetSingleCarData.images;
      if (carImageArray.length>0) {
        GetSingleCarData.images = await attachUrlWithImage(GetSingleCarData.images); 
      }
      if(GetSingleCarData.creator){

        if (GetSingleCarData.creator.avatarurl && GetSingleCarData.creator.avatarurl != '') {
          GetSingleCarData.creator.avatarurl = process.env.SITE_URL+"user-images/"+GetSingleCarData.creator.avatarurl;
        }else{
          GetSingleCarData.creator.avatarurl = process.env.SITE_URL+"user-images/"+constants.PLACE_HOLDER_IMAGES.USER_PLACEHOLDER;
        }
        
        let subscription = GetSingleCarData.creator.subscriptions[0];

        let currentime = moment().format("X");
  
        if (parseInt(subscription.expirytimes) >  parseInt(currentime) &&  subscription.status == 'active' && subscription.type == 'paid') {
          GetSingleCarData.is_subscriber = true;
        }else{
          GetSingleCarData.is_subscriber = false;
          GetSingleCarData.creator.gsm = "";
          GetSingleCarData.creator.email = "";
          
        }
        
      }

      return GetSingleCarData;
    }else{
      return false;
    }
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getFeaturedCarImage = function (CarId) {
  return Bluebird.try(async() => { 
    let GetSingleCarData = await carsModel.findById(CarId).select("featured_image compressed_featured_image").lean();
    return GetSingleCarData;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const deleteCar = function (CarId) {
  return Bluebird.try(async() => { 
    let deleteImagesIfExist = await UnlinkCarImages(CarId);
    let deleteSingleCar = await carsModel.remove({_id:CarId});
    return true; 
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};


const UnlinkCarImages = function (CarId) {
  return Bluebird.try(async() => { 
    let getCarDetails = await carsModel.findById(CarId).lean();
    if (getCarDetails.featured_image && getCarDetails.featured_image != '') {
      let CarUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.CARS_IMAGES);
      let imagePath =  CarUploadDirPath+"/"+getCarDetails.featured_image;
      let unlinkImage = await commonFunctionController.unlinkImage(imagePath);
    }
    let ImageArray = getCarDetails.images;
    if (ImageArray.length>0) {
      return Bluebird.map(ImageArray, async function (row) {
        let CarUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.CARS_IMAGES);
        let imagePath =  CarUploadDirPath+"/"+row;
        let unlinkImage = await commonFunctionController.unlinkImage(imagePath);
      }).then(async(returnData) => {
        return true;
      });
    }
    return true;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getMyCarDataCounts = function (userId) {
  return Bluebird.try(async() => { 
    console.log("userId : ",userId);
    let returnArray = {};
    returnArray.sold_cars_count = await carsModel.find({creator:userId,status:"sold"}).countDocuments().lean();
    returnArray.listing_cars_count = await carsModel.find({creator:userId,status:"active"}).countDocuments().lean();
    return returnArray;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};


const getMyAllDataCounts = function (userId) {
  return Bluebird.try(async() => { 
    let cars_count = await carsModel.find({creator:userId}).countDocuments().lean();
    console.log("cars_count : ",cars_count);
    console.log("userId : ",userId);
    return cars_count;
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const deleteImageFromArray = function (postData) {
  return Bluebird.try(async() => { 
    let parsed = await url.parse(postData.image_url);
    let imagename = await (path.basename(parsed.pathname));
    let checkImageExist = await carsModel.findOne( { _id:postData.car_id, images: { $in : [imagename]} }).countDocuments();
    if (checkImageExist>0) {
      let CarUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.CARS_IMAGES);
      let imagePath =  CarUploadDirPath+"/"+imagename;
      let unlinkImage = await commonFunctionController.unlinkImage(imagePath);
      let deleteCarImage = await carsModel.update( { _id: postData.car_id }, { $pull: { images: imagename}});
    }else{
      return false;
    }
    return true; 
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const pushCarImages = function (PushImagesArray,car_id) {
  return Bluebird.try(async() => { 
      let updateImages = await carsModel.update( { _id:car_id }, { $push: { images: PushImagesArray}});
      return updateImages
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const updateCarDetails = function(postData,car_id){
  return Bluebird.try(async() => {
    return carsModel.findOneAndUpdate({_id:car_id},{$set:postData},{new:true}).lean();
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const updateCarImages = function(){
  return Bluebird.try(async() => {
    let carList = await  carsModel.find({}).lean();
    return Bluebird.map(carList, async function (row) {
      let updateUserData = {};
      updateUserData.featured_image = '';
      if (row.images.length>0) {
        updateUserData.featured_image = row.images[0];
      }
      let returnUpdatedData = await updateCarDetails(updateUserData,row._id);
      return row;
    }).then(async(returnData) => {
      return returnData;
    });
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const updateClickForCar = function(car_id,clickCount){
  return Bluebird.try(async() => {
    let postData = {};
    postData.clicks = clickCount;
    return carsModel.findOneAndUpdate({_id:car_id},{$set:postData},{new:true}).lean();
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const groupByQuery = function(){
  return Bluebird.try(async() => {
    let fuelTYpe = await carsModel.aggregate( [ { $group : { _id : "$transmission",count: { $sum: 1 } } } ] );
    return fuelTYpe;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const getCarList = function (postData,userData) {
  return Bluebird.try(async() => {
    let limit = 10;
    let skip = 0;
    let query = {};
    let arranger = {arranger : -1};
    if (postData.limit && postData.limit != '') { 
      limit = await parseInt(postData.limit);
    }
    if (postData.page && postData.page != '') {
      let page = await parseInt(postData.page);
      page = page-1;
      skip = page*limit;
    }

    query["$and"] = [{status : "active"},{creator : { $in: postData.subscribers }}];

    if(postData.page_name && postData.page_name == 'listing'){
      //
    }else{
        if ( postData.creator && postData.creator != '' ){ 
            query.creator  = postData.creator;
            arranger = { arranger : -1 };
        }else{
            query.creator = { $in: postData.subscribers };
            arranger = { arranger : -1 };
        }
    }

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

    if ( postData.transmission && postData.transmission != '' ) { 
      let transmission = postData.transmission;
      transmission = transmission.split(',');
      query.transmission = {  $in : transmission   }
    };

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

    // if (postData.is_featured && postData.is_featured != '') {
    //   if(postData.is_featured == 'yes'){
    //     query.featured  = {$exists: true};
    //   } else{
    //     query.featured  = {$exists: false};
    //   }
    // }

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

      if(YearArray.includes("2006")){
        console.log("inside 2006");
        query["$or"] = [{ year : {$lte:2006} },{ year: {$in : YearArray} }];

        console.log("quiery",query);

      }else{
        query.year = { $in : YearArray }
      }
    };

    if (postData.mileage && postData.mileage != '') { query.mileage = await new RegExp(commonFunctionController.escapeRegex(postData.mileage), 'gi')};
    if (postData.address && postData.address != '') { query.address = await new RegExp(commonFunctionController.escapeRegex(postData.address), 'gi')};
  
    let countTotalRecords = await carsModel.find(query).sort(arranger).countDocuments().lean();

    let CarList = await carsModel.find(query).sort(arranger).skip(skip).limit(limit).lean();

    let favorites = '';
    if (userData && userData != '' && userData.favourite && userData.favourite != '') {
      favorites = userData.favourite;
    }
    return Bluebird.map(CarList, async function (row) {
      row.is_favorite = "no";
      if (favorites && favorites != '') {
        let car_id = row._id;
        car_id = car_id.toString();
        if(favorites.indexOf(car_id) == 0 || favorites.indexOf(car_id) == '0'){
          row.is_favorite = 'yes';
        }else{
          row.is_favorite = 'no';
        }
      }else{
        row.is_favorite = 'no';
      }
      if (row.featured_image && row.featured_image != '') {
        row.featured_image = process.env.SITE_URL+"cars-images/"+row.featured_image;
      }else{
        row.featured_image = process.env.SITE_URL+"place-holder-images/"+constants.PLACE_HOLDER_IMAGES.CARS_PLACEHOLDER;
      }
      // let CheckImages = row.images;
      // if (CheckImages.length>0) {
      //     row.images = await attachUrlWithImage(row.images);
      //     return row;
      // }else{
      //   return row;
      // }
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

const getMyCars = function (postData,userId) {
  return Bluebird.try(async() => {
    let limit = 10;
    let skip = 0;
    let query = {};
    let arranger = {arranger : -1};
    if (postData.limit && postData.limit != '') { 
      limit = await parseInt(postData.limit);
    }
    if (postData.page && postData.page != '') {
      let page = await parseInt(postData.page);
      page = page-1;
      skip = page*limit;
    }

    query    = { $and: [{}]};

    if(postData.search && postData.search != ''){
      let regex = new RegExp(postData.search, "i");
      query["$or"] =  [{ title: regex }, { slug: regex }, { bodytype: regex }, { condition: regex }, { fueltype: regex }, { drive: regex },
        { exteriorcolor: regex }, { interiorcolor: regex }, { make: regex }, { model: regex }];
        arranger = { arranger : -1 };
    }
    query.creator = userId;

    let countTotalCars = await carsModel.find(query).sort(arranger).countDocuments().lean();
    let carList = await carsModel.find(query).sort(arranger).skip(skip).limit(limit).lean();

    return Bluebird.map(carList, async function (row) {
      if (row.featured_image && row.featured_image != '') {
        row.featured_image = process.env.SITE_URL+"cars-images/"+row.featured_image;
      }else{
        row.featured_image = process.env.SITE_URL+""+constants.PLACE_HOLDER_IMAGES.CARS_PLACEHOLDER;
      }

      // let CheckImages = row.images;
      // if (CheckImages.length>0) {
      //     row.images = await attachUrlWithImage(row.images);
      //     return row;
      // }else{
      //   return row;
      // }
      return row;
    }).then(async(returnData) => {
      let returnArray = {};
      returnArray.list = returnData;
      returnArray.totalCount = countTotalCars;
      return returnArray;
    });
  }).catch((error) => {
    console.error(error);
  });
};

const LikeDislikeCars = function(car_id,userId){
  return Bluebird.try(async() => {
    let postData = {};
    postData.is_favorite = "no";
    let checkAlreadyExist = await UsersModel.find( { $and: [ { favourite : { $in: [ car_id ] } },{ _id: userId } ] } ).lean();
    if (checkAlreadyExist.length>0) {
      postData.is_favorite = "no";
      let removeFromFav = await  UsersModel.findOneAndUpdate({ _id: userId },{ $pull: { favourite: car_id } },{new:true}).lean();
      return postData;
    }else{
      let addToFav = await UsersModel.findOneAndUpdate({ _id: userId },{ $push: { favourite: car_id } },{new:true}).lean();
      postData.is_favorite = "yes";
      return postData;
    }
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const getFavoriteList = function (userData,postData) {
  return Bluebird.try(async() => { 
    if (userData.favourite && userData.favourite != '') {
      let limit = 10;
      let skip = 0;
      let query = {};
      let arranger = { arranger : -1 };
      if (postData.limit && postData.limit != '') { 
        limit = await parseInt(postData.limit);
      }
      if (postData.page && postData.page != '') {
        let page = await parseInt(postData.page);
        page = page-1;
        skip = page*limit;
      }
      
      let getFavorites = await carsModel.find( { _id: { $in: userData.favourite } } ).sort(arranger).skip(skip).limit(limit).lean();

      let getFavoritesCount = await carsModel.find( { _id: { $in: userData.favourite } } ).sort(arranger).countDocuments().lean();
      return Bluebird.map(getFavorites, async function (row) {
        if (row.featured_image && row.featured_image != '') {
          row.featured_image = process.env.SITE_URL+"cars-images/"+row.featured_image;
        }else{
          row.featured_image = process.env.SITE_URL+""+constants.PLACE_HOLDER_IMAGES.CARS_PLACEHOLDER;
        }
        let CheckImages = row.images;
        if (CheckImages.length>0) {
            row.images = await attachUrlWithImage(row.images);
            return row;
        }else{
          return row;
        }
      }).then(async(returnData) => {
        let returnArray = {};
        returnArray.list = returnData;
        returnArray.totalCount = getFavoritesCount;
        return returnArray;
      });
    }else{
      let returnArray = {};
      returnArray.list = [];
      returnArray.totalCount = 0;
      return returnArray;
    }
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const bookTestDrive = function (postData) {
  return Bluebird.try(async() => { 
    if (postData.mobile_number && postData.mobile_number != '') {
      postData.mobile_number = await parseInt(postData.mobile_number);
    }
    let saveDriveTest = new testDriveModel(postData);
    return saveDriveTest.save()
    .then((isSaved)=>{    
      console.log("isSaved : ",isSaved);
      return testDriveModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const getTestDriveList = function(postData){
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
    query["$and"]  = [{}];

    if(postData.search && postData.search){
      let regex = new RegExp(postData.search, "i");
      query["$or"] = [{ fullname: regex }, { email: regex }];
    }

    if ( postData.status && postData.status != '' ) { query.status = postData.status };
    let listTestDrive = await testDriveModel.find(query).sort(arranger).skip(skip).limit(limit).lean();
    let TestDriveCount = await testDriveModel.find(query).sort(arranger).countDocuments().lean();

    let returnArray = {};
    returnArray.list = listTestDrive;
    returnArray.totalCount = TestDriveCount;
    return returnArray;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const getSingleTestDriveDetails = function (id) {
  return Bluebird.try(async() => { 
      return testDriveModel.findById(id).populate("creator","_id fullname email").lean();
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const deleteTestDriveRecord = function (recordId) {
  return Bluebird.try(async() => { 
      let deleteRecord = await testDriveModel.remove({_id:recordId});
      return deleteRecord
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};



const getRecentAds = function () {
  return Bluebird.try(async() => { 
    let recentAdsList = await  carsModel.find({status:"active"}).select("featured_image slug title year bodytype price make model creator date address").sort({arranger : -1}).limit(3).lean();
    if(recentAdsList.length>0){
      return Bluebird.map(recentAdsList, async function (row) {
        row.featured_image = process.env.SITE_URL+"cars-images/"+row.featured_image;
        return row;
      }).then(async(returnArray) => {
        return returnArray;
      });
    }else{
      return [];
    }
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};

const updateTestDriveDetails = function(postData){
  return Bluebird.try(async() => {
      let id = postData._id;
      delete postData._id;
      let updateDetails = await  testDriveModel.findOneAndUpdate({_id:id},{$set:postData},{new:true}).lean();
      if (updateDetails) {
        return testDriveModel.findById(updateDetails._id).populate("creator","_id fullname email").lean();
      }else{
        return false;
      }
      return updateDetails;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};


const updateAd = function(id,update){
  return Bluebird.try(async() => {
    let updateCarDetails = await  carsModel.findOneAndUpdate(id,update).lean();
    return updateCarDetails;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const getAllCarsSlugs = function(id,update){
  return Bluebird.try(async() => {
    let carSlugs = await carsModel.aggregate([
      {
        $group:{_id:null, array:{$push:"$slug"}}
      }
    ]);
    if(carSlugs && carSlugs[0] && carSlugs[0].array && carSlugs[0].array.length>0){
      return carSlugs[0].array;
    }else{
      return false;
    }
  }).catch((error) => {
    console.error(error);
    return error;
  });
};

const getAllCarTypes = function(){
  return Bluebird.try(async() => {
    let getCarTypes = await  CarTypesModel.find({}).lean();
    return getCarTypes;
  }).catch((error) => {
    console.error(error);
    return error;
  });
};


const addCarType = function(postData){
  return Bluebird.try(async() => { 
    let addCarTypeData = new CarTypesModel(postData);
    return addCarTypeData.save()
    .then((isSaved)=>{    
      return CarTypesModel.findById(isSaved._id).lean();
    });
  }).catch((error) => {   
    console.error(error);
    return error;
  });
};


module.exports = {
  addCar:addCar,
  ModifyImagesData:ModifyImagesData,
  getCarList:getCarList,
  attachUrlWithImage:attachUrlWithImage,
  getSingleCarData:getSingleCarData,
  deleteCar:deleteCar,
  UnlinkCarImages:UnlinkCarImages,
  deleteImageFromArray:deleteImageFromArray,
  pushCarImages:pushCarImages,
  updateCarDetails:updateCarDetails,
  updateClickForCar:updateClickForCar,
  LikeDislikeCars:LikeDislikeCars,
  getFavoriteList:getFavoriteList,
  bookTestDrive:bookTestDrive,
  getTestDriveList:getTestDriveList,
  getSingleTestDriveDetails:getSingleTestDriveDetails,
  updateTestDriveDetails:updateTestDriveDetails,
  updateCarImages:updateCarImages,
  getMyCarDataCounts:getMyCarDataCounts,
  getRecentAds:getRecentAds,
  groupByQuery:groupByQuery,
  getMyCars:getMyCars,
  getFeaturedCarImage:getFeaturedCarImage,
  updateAd:updateAd,
  getSingleCarDataBySlug:getSingleCarDataBySlug,
  getAllCarsSlugs:getAllCarsSlugs,
  getMyAllDataCounts:getMyAllDataCounts,
  deleteTestDriveRecord:deleteTestDriveRecord,
  compressFeaturedImage:compressFeaturedImage,
  getAllCarTypes:getAllCarTypes,
  addCarType:addCarType
};