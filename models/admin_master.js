"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;

// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }

const AdminMasterSchema = new Schema({

    name: {
        type: String,
        default:"",
        required:false
    },
    email: {
        type: String,
        index: { unique: true, dropDups: true, sparse: true},
        required: false 
    },
    password: {
        type: String,
        default:"",
        required:false
    },
    status: {
        type: String,
        default:"",
        required:false
    },
    mobile_number: {
        type: String,
        index: { unique: true, dropDups: true, sparse: true},
        required: false 
    },
    role: {
        type: String,
        enum: ["admin"],
        default:"admin",
        required:false,
    },

}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// UserSchema.plugin(utils.uuidPlugin);
AdminMasterSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("admin_master", AdminMasterSchema);

