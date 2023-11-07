"use strict";

const router = require("express-promise-router")();
const Bluebird = require("bluebird");
const AdminController = require("../controllers/admin_master");
const utils = require("../utils/utils");
const constants = require("../utils/constants");
const customErrors = require("../utils/errors");
const multerSettings = require("../utils/multer-settings");
const commonFunctionController = require("../controllers/common_functions");
const CarsController = require("../controllers/cars");
const BlogsController = require("../controllers/blogs");



router.get("/get-all-makes", function (req, res, next) {
  return Bluebird.try(async () => {
    let postData = req.body;
    let response = { success: false };
    let getAllMakes = await AdminController.getAllMakes();

    if (getAllMakes.length > 0) {
      response.success = true;
      response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
      response.data = getAllMakes;
    } else {
      response.success = false;
      response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
    }
    return res.status(200).send(response);
  });
});

  router.get("/get-single-make/:id", function (req, res, next) {
    return Bluebird.try(async() => {
      let postData = req.body;
      let response = {success:false}; 
      let make_id = req.params.id;
        let getSingleMake = await AdminController.getSingleMake(make_id);
        if(getSingleMake){
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
          response.data = getSingleMake;
        }else{
          response.success = false;
          response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
        }
      return res.status(200).send(response);
    });
  });

  router.get("/get-all-cars-slugs", function (req, res, next) {
    return Bluebird.try(async() => {
      let postData = req.body;
      let response = {success:false}; 
      let make_id = req.params.id;
        let getAllCarsSlugs = await CarsController.getAllCarsSlugs(make_id);
        if(getAllCarsSlugs.length>0){
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
          response.data = getAllCarsSlugs;
        }else{
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
          response.data = [];
        }
      return res.status(200).send(response);
    });
  });

  router.get("/get-all-blogs-slugs", function (req, res, next) {
    return Bluebird.try(async() => {
      let postData = req.body;
      let response = {success:false}; 
      let make_id = req.params.id;
        let getAllBlogsSlugs = await BlogsController.getAllBlogsSlugs(make_id);
        if(getAllBlogsSlugs.length>0){
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
          response.data = getAllBlogsSlugs;
        }else{
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
          response.data = [];
        }
      return res.status(200).send(response);
    });
  });


  router.get("/get-all-car-types", function (req, res, next) {
    return Bluebird.try(async() => {
      let postData = req.body;
      let response = {success:false}; 
        let getAllCarTypes = await CarsController.getAllCarTypes();
        if(getAllCarTypes.length>0){
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
          response.data = getAllCarTypes;
        }else{
          response.success = true;
          response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
          response.data = [];
        }
      return res.status(200).send(response);
    });
  });

module.exports = router;