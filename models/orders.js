"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;

const OrdersSchema = new Schema({
    creator   : { type: Schema.Types.ObjectId, ref: 'users' },
    fullname  : String,
    email     : String,
    gsm       : String,
    sub       : Object,
    featured  : Object,
    listing   : Object,
    status    : String,
    date      : String,
    arranger  : { type: Date, default: Date.now },
    timestamp : String
}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
// UserSchema.plugin(utils.uuidPlugin);
OrdersSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("orders", OrdersSchema);