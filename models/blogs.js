"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;

// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }

const BlogsSchema = new Schema({
    title: {
        type: String,
        default:"",
        required:false
    },
    image: {
        type: String,
        default:"",
        required:false
    },
    description: {
        type: String,
        default:"",
        required:false
    },
    category: {
        type: String,
        default:"",
        required:false
    },
    slug: {
        type: String,
        default:"",
        required:false
    },
    creator: { 
      type: Schema.Types.ObjectId, ref: 'users' 
    },
}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
// UserSchema.plugin(utils.uuidPlugin);
BlogsSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("blogs", BlogsSchema);