"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;
// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }
const ContactUsSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId, ref: 'users',
    },
    fullname: {
        type: String,
        default:"",
        required:false
    },
    email: {
        type: String,
        default:"",
        required:false
    },
    mobile_number: {
        type: Number,
        default:0,
        required:false 
    },
    subject: {
        type: String,
        default:"",
        required:false
    },
    message: {
        type: String,
        default:"",
        required:false
    },
    status: {
        type: String,
        enum: ["pending","completed"],
        default:"pending",
        required:false,
    }
}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
// UserSchema.plugin(utils.uuidPlugin);
ContactUsSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("contact_us", ContactUsSchema);

