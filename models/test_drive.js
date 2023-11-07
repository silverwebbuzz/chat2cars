"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;

// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }

const TestDriveSchema = new Schema({

    creator: { 
        type: String,
        default:"",
        required:false 
    },
    fullname: {
        type: String,
        default:"",
        required:false
    },
    mobile_number: {
        type: Number,
        default:0,
        required:false
    },
    email: {
        type: String,
        default:"",
        required:false
    },
    state: {
        type: String,
        default:"",
        required:false
    },
    city: {
        type: String,
        default:"",
        required:false
    },  
    postcode: {
        type: String,
        default:"",
        required:false
    },
    status: {
        type: String,
        enum: ["completed","canceled","pending","approved","rejected"],
        default:"pending",
        required:false,
    },
    car_brand: {
        type: String,
        default:"",
        required:false
    },
    car_model: {
        type: String,
        default:"",
        required:false 
    },

    datetime: {
        type: Date,
        default:Date.now,
        required:false 
    },

}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// UserSchema.plugin(utils.uuidPlugin);
TestDriveSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("test_drive", TestDriveSchema);
