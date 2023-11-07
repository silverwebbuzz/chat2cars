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
const BlogsController = require("../controllers/blogs");
const commonFunctionController = require("../controllers/common_functions");
const path = require("path");
const moment     = require('moment');

let uploadBlogImageConfig = multerSettings.uploadBlogImageConfig;

router.post("/add-blog",[authetication.authenticate_admin], function (req, res, next) {
    return Bluebird.try(async() => {
        let upload = Bluebird.promisify(uploadBlogImageConfig);
        return upload(req, res).then(async(data) => {
            let response = {success:false};
            let postData = req.body;
            postData.creator = req.user._id; 
            if(req.files && req.files.image && req.files.image[0] && req.files.image[0].filename && req.files.image[0].filename != ''){
                postData.image = req.files.image[0].filename;
            }
            else{
                postData.image = "";
            }
            let slug = postData.title.toLowerCase()+'-'+Date.now(); 

            slug = slug.replace(/[^a-zA-Z ]/g, "");
            
            postData.slug = slug.replace(new RegExp(' ', 'g'), '-');

            let saveBlog = await BlogsController.saveBlog(postData);
            if(saveBlog){
                if (saveBlog.image && saveBlog.image != '') {
                    saveBlog.image = process.env.SITE_URL+"blog-images/"+saveBlog.image;
                }else{
                    saveBlog.image = process.env.SITE_URL+""+constants.PLACE_HOLDER_IMAGES.DEFAUT_PLACEHOLDER;
                }
                response.success = true;
                response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
                response.data = saveBlog;
            }else{
                response.success = false;
                response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
            }
            return res.status(200).send(response);
        });
    });
});

router.post("/list-blogs", function (req, res, next) {
    return Bluebird.try(async() => {
        let response = {success:false};
        let postData = req.body;
        let BlogList = await BlogsController.BlogList(postData);
        let isEmptyList = BlogList.list;
        if(isEmptyList.length>0){
            response.success = true;
            response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
            response.count_records = BlogList.totalCount;
            response.data = BlogList.list; 
        }else{
            response.success = false;
            response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
        }
        return res.status(200).send(response);
    });
});


router.put("/update-blog",[authetication.authenticate_admin], function (req, res, next) {
    return Bluebird.try(async() => {
        let upload = Bluebird.promisify(uploadBlogImageConfig);
        return upload(req, res).then(async(data) => {
            let response = {success:false};
            let postData = req.body;
            if(req.files.image && req.files.image[0] && req.files.image[0].filename && req.files.image[0].filename != ''){
                postData.image = req.files.image[0].filename;
                let unlinkImage = await BlogsController.unlinkBlogImage(postData.blog_id);
            }
            let updateBlog = await BlogsController.updateBlogData(postData);
            if(updateBlog){
                response.success = true;
                response.msg = constants.COMMON_MESSAGES.DATA_UPDATED;
                response.data = updateBlog; 
            }else{
                response.success = false;
                response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
            }
            return res.status(200).send(response);
        });
    });
});


router.delete("/delete-blog-by-id/:blog_id",[authetication.authenticate_admin], function (req, res, next) {
    return Bluebird.try(async() => {
        let response = {success:false};
        let postData = req.body;
        let blog_id  = req.params.blog_id;
        let deleteSingleBlog = await BlogsController.deleteSingleBlog(blog_id);
        if(deleteSingleBlog){
            response.success = true;
            response.msg = constants.COMMON_MESSAGES.DATA_DELETED;
            response.data = deleteSingleBlog; 
        }else{
            response.success = false;
            response.msg = constants.COMMON_ERROR_MESSAGES.DEFAULT_ERROR;
        }
        return res.status(200).send(response);
    });
});

router.get("/get-blog-by-id/:blog_id", function (req, res, next) {
    return Bluebird.try(async() => {
        let response = {success:false};
        let postData = req.body;
        let blog_id  = req.params.blog_id;
        if (blog_id.match(/^[0-9a-fA-F]{24}$/)) {
            let getSingleBlog = await BlogsController.getSingleBlog(blog_id);
            if(getSingleBlog){
                if (getSingleBlog.image && getSingleBlog.image != '') {
                    getSingleBlog.image = process.env.SITE_URL+"blog-images/"+getSingleBlog.image;
                }else{
                    getSingleBlog.image = process.env.SITE_URL+""+constants.PLACE_HOLDER_IMAGES.DEFAUT_PLACEHOLDER;
                }
                response.success = true;
                response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
                response.data = getSingleBlog; 
            }else{
                response.success = false;
                response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
            }
        }else{
            response.success = false;
            response.msg = "Blod id not valid";
        }
        return res.status(200).send(response);
    });
});

router.get("/get-blog-by-slug/:slug", function (req, res, next) {
    return Bluebird.try(async () => {
        let response = { success: false };
        let slug = req.params.slug;
        let getSingleBlog = await BlogsController.getSingleBlogBySlug(slug);
        if (getSingleBlog) {
            if (getSingleBlog.image && getSingleBlog.image != '') {
                getSingleBlog.image = process.env.SITE_URL + "blog-images/" + getSingleBlog.image;
            } else {
                getSingleBlog.image = process.env.SITE_URL + "" + constants.PLACE_HOLDER_IMAGES.DEFAUT_PLACEHOLDER;
            }
            response.success = true;
            response.msg = constants.COMMON_MESSAGES.DATA_FOUND;
            response.data = getSingleBlog;
        } else {
            response.success = false;
            response.msg = constants.COMMON_MESSAGES.DATA_NOT_FOUND;
        }
        return res.status(200).send(response);
    });
});

module.exports = router;
