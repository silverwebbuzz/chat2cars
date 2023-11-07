"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;
// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }
const UserSubscriptionsLogsSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId, ref: 'users',
    },
    name: {
        type: String,
        default:"",
        required:false
    },
    title: {
        type: String,
        default:"",
        required:false
    },
    amount: {
        type: String,
        default:"",
        required:false 
    },
    price: {
        type: Number,
        default:0,
        required:false 
    },
    duration: {
        type: Number,
        default:1,
        required:false 
    },

    startcdate: {
        type: Date,
        default: Date.now,
        required:false 
    },
    expirycdate: {
        type: Date,
        default: Date.now,
        required:false
    },
    starttimes: {
        type: String,
        default:"",
        required:false 
    },
    expirytimes: {
        type: String,
        default:"",
        required:false 
    },
    status: {
        type: String,
        default:"",
        required:false 
    },
    type: {
        type: String,
        default:"",
        required:false 
    },
    subs_id: {
        type: Schema.Types.ObjectId, ref: 'subscriptions' ,
    },
   
}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
// UserSchema.plugin(utils.uuidPlugin);
UserSubscriptionsLogsSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("user_subscription_logs", UserSubscriptionsLogsSchema);

