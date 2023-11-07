"use strict";

const Bluebird = require("bluebird");
const blogsModel = require("../models/blogs");
const constants = require("../utils/constants");
const utils = require("../utils/utils");
const crypto = require('crypto');
const mongodb = require('mongodb');
const carsModel = require("../models/cars");
const commonFunctionController = require("../controllers/common_functions");
const path = require("path");
const url = require("url");

const saveBlog = function (postData) {
    return Bluebird.try(() => {
        let blogData = new blogsModel(postData);
        return blogData.save()
            .then((isSaved) => {
                return blogsModel.findById(isSaved._id).lean();
            });
    }).catch((error) => {
        console.error(error);
        return error;
    });
};


const BlogList = function (postData) {
    return Bluebird.try(async () => {
        let limit = 12;
        let skip = 0;
        let query = {};
        let arranger = { created_at: -1 };
        if (postData.limit && postData.limit != '') {
            limit = await parseInt(postData.limit);
        }
        if (postData.page && postData.page != '') {
            let page = await parseInt(postData.page);
            page = page - 1;
            skip = page * limit;
        }
        query["$and"] = [{}];

        if (postData.search && postData.search) {
            let regex = new RegExp(postData.search, "i");
            query["$or"] = [{ category: regex }, { title: regex }];
        }

        if (postData.category && postData.category != '') {
            let categories = postData.category;
            categories = categories.split(',');
            query.category = { $in: categories };
        };

        if (postData.title && postData.title != '') {
            query.title = { $regex: postData.title, '$options': 'i' };
        };

        if (postData.blog_id && postData.blog_id != '') { query._id = postData.blog_id };

        let countTotalRecords = await blogsModel.find(query).sort(arranger).countDocuments().lean();
        let blogList = await blogsModel.find(query).sort(arranger).skip(skip).limit(limit).lean();
        return Bluebird.map(blogList, async function (row) {
            if (row.image && row.image != '') {
                row.image = process.env.SITE_URL + "blog-images/" + row.image;
            } else {
                row.image = process.env.SITE_URL + "" + constants.PLACE_HOLDER_IMAGES.DEFAUT_PLACEHOLDER;
            }
            let getTimeAgo = await timeSince(row.created_at);
            row.time_ago = getTimeAgo;
            return row;
        }).then(async (returnData) => {
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

const timeSince = function (date) {
    return Bluebird.try(async () => {
        let time = "";
        let seconds = await Math.floor((new Date() - date) / 1000);
        let interval = await Math.floor(seconds / 31536000);
        if (interval >= 1) {
            return interval + " years";
        }
        interval = await Math.floor(seconds / 2592000);
        if (interval >= 1) {
            return interval + " months";
        }
        interval = await Math.floor(seconds / 86400);
        if (interval >= 1) {
            return interval + " days";
        }
        interval = await Math.floor(seconds / 3600);
        if (interval >= 1) {
            return interval + " hours";
        }
        interval = await Math.floor(seconds / 60);
        if (interval >= 1) {
            return interval + " minutes";
        }
        return await Math.floor(seconds) + " seconds";
    }).catch((error) => {
        console.error(error);
        return error;
    });
};


const unlinkBlogImage = function (blog_id) {
    return Bluebird.try(async () => {
        let getBlogData = await blogsModel.findById(blog_id).lean();
        if (getBlogData.image && getBlogData.image != '') {
            let BlogUploadDirPath = path.join(__dirname, "..", constants.UPLOAD_DIR_PATH.BLOG_IMAGES);
            let imagePath = BlogUploadDirPath + "/" + getBlogData.image;
            let unlinkImage = await commonFunctionController.unlinkImage(imagePath);
            return true;
        } else {
            return true;
        }
    }).catch((error) => {
        console.error(error);
        return error;
    });
};

const updateBlogData = function (postData) {
    return Bluebird.try(async () => {
        let blog_id = postData.blog_id;
        delete postData.blog_id;
        return blogsModel.findOneAndUpdate({ _id: blog_id }, { $set: postData }, { new: true }).lean();
    }).catch((error) => {
        console.error(error);
        return error;
    });
};

const getAllBlogsSlugs = function () {
    return Bluebird.try(async () => {
        let blogSlugs = await blogsModel.aggregate([
            {
                $group: { _id: null, array: { $push: "$slug" } }
            }
        ]);
        if (blogSlugs && blogSlugs[0] && blogSlugs[0].array && blogSlugs[0].array.length > 0) {
            return blogSlugs[0].array;
        } else {
            return false;
        }
    }).catch((error) => {
        console.error(error);
        return error;
    });
};


const deleteSingleBlog = function (blogId) {
    return Bluebird.try(async () => {
        let deleteRecord = await blogsModel.remove({ _id: blogId });
        return deleteRecord
    }).catch((error) => {
        console.error(error);
        return error;
    });
};

const getSingleBlog = function (blogId) {
    return Bluebird.try(async () => {
        let getRecord = await blogsModel.findById(blogId);
        return getRecord
    }).catch((error) => {
        console.error(error);
        return error;
    });
};

const getSingleBlogBySlug = function (slug) {
    return Bluebird.try(async () => {
        let getRecord = await blogsModel.findOne({ slug });
        return getRecord
    }).catch((error) => {
        console.error(error);
        return error;
    });
};


module.exports = {
    saveBlog: saveBlog,
    BlogList: BlogList,
    timeSince: timeSince,
    updateBlogData: updateBlogData,
    unlinkBlogImage: unlinkBlogImage,
    getAllBlogsSlugs: getAllBlogsSlugs,
    deleteSingleBlog: deleteSingleBlog,
    getSingleBlog: getSingleBlog,
    getSingleBlogBySlug: getSingleBlogBySlug,
};