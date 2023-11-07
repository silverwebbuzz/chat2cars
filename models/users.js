"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;

const UsersSchema = new Schema({

    fullname: {
        type: String,
        default:"",
        required:false
    },
    email: {
        type: String,
        index: { unique: true, dropDups: true, sparse: true},
        required: true 
    },
    forgot_password_str: {
        type: String,
        default:"",
        required:false
    },
    avatarurl: {
        type: String,
        default:"",
        required:false
    },
    avatar_image_name: {
        type: String,
        default:"",
        required:false
    },
    logourl: {
        type: String,
        default:"",
        required:false
    },
    logo_image_name: {
        type: String,
        default:"",
        required:false
    },
    date: {
        type: String,
        default:"",
        required:false
    },
    arranger: {
        type: Date,
        default: Date.now,
        required:false
    },
    gsm: {
        type: String,
        default:"",
        required:false
    },
    status: {
        type: String, 
        default: 'not_verified',
        required:false
    },
    subscriptions: {
        type: Array,
        default:[],
        required:false
    },
    businessname: {
        type: String,
        default:"",
        required:false
    },
    businessAddress: {
        type: String,
        default:"",
        required:false
    },
    province: {
        type: String,
        default:"",
        required:false
    },
    city: {
        type: String,
        default:"",
        required:false
    },
    address: {
        type: String,
        default:"",
        required:false
    },
    randid: {
        type: String,
        default:"",
        required:false
    },
    admin        : { 
        username : String,
        password : String
    },
    facebook     : {
        id       : String,
        token    : String
    },
    google       : {
        id       : String,
        token    : String
    },
    favourite: {
        type: Array,
        default:[],
        required:false
    },
    histories: {
        type: Array,
        default:[],
        required:false
    },
    local         : { 
        password : String
    },
    type: {
        type: String,
        default:"user",
        required:false
    },

    dealership : Object,
    

}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// UserSchema.plugin(utils.uuidPlugin);
UsersSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("users", UsersSchema);