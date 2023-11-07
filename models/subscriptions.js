"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;
// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }
const SubscriptionsSchema = new Schema({

    creator: {
        type: Schema.Types.ObjectId, ref: 'users' ,
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
    number: {
        type: Number,
        default:"",
        required:false 
    },
    price: {
        type: Number,
        default:"",
        required:false 
    },
    date: {
      type: Date,
      default: Date.now,
      required:false 
    },
    status: {
        type: String,
        default:"",
        required:false
    },
    type: {
        type: String,
        enum: ["paid","free"],
        default:"paid",
        required:false,
    },
    sub_type: {
        type: String,
        enum: ["dealership","subscription"],
        default:"paid",
        required:false,
    },
}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
// UserSchema.plugin(utils.uuidPlugin);
SubscriptionsSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("subscriptions", SubscriptionsSchema);

