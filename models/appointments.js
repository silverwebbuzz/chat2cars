"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;

// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }

const AppointmentsSchema = new Schema({
    date: {
        type: Date,
        required:true
    },
    time: {
        type: String,
        default:"",
        required:false
    },
    fullname: {
        type: String,
        default:"",
        required:false
    },
    address1: {
        type: String,
        default:"",
        required:false
    },
    address2: {
        type: String,
        default:"",
        required:false
    },
    email: {
        type: String,
        default:"",
        required:false
    },
    date_of_birth: {
        type: Date,
        default:"",
        required:false
    },
    mobile_number: {
        type: Number,
        default:"",
        required:false
    },
    country_code: {
        type: String,
        default:"",
        required:false
    },
    country: {
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
    reason: {
        type: String,
        default:"",
        required:false
    },
    creator: { 
      type: Schema.Types.ObjectId, ref: 'users' 
    },
    status: { 
        type: String,
        enum: ["pending","canceled","completed"],
        default:"pending",
        required:false,
      },

}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
// UserSchema.plugin(utils.uuidPlugin);
AppointmentsSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("appointments", AppointmentsSchema);