"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;
// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }
const PaymentSchema = new Schema({

    m_payment_id: {
        type: String,
        default:"",
        required:false
    },
    pf_payment_id: {
        type: String,
        default:"",
        required:false
    },
    payment_status: {
        type: String,
        default:"",
        required:false
    },
    item_name: {
        type: String,
        default:"",
        required:false
    },
    email_address: {
        type: String,
        default:"",
        required:false
    },
    merchant_id: {
        type: String,
        default:"",
        required:false
    },
    billing_date: {
        type: String,
        default:"",
        required:false
    },
    amount_gross: {
        type: String,
        default:"",
        required:false
    },
    amount_fee: {
        type: String,
        default:"",
        required:false
    },
    amount_net: {
        type: String,
        default:"",
        required:false
    },
    name_first: {
        type: String,
        default:"",
        required:false
    },
    name_last: {
        type: String,
        default:"",
        required:false
    },

    custom_str1   : { type: Schema.Types.ObjectId, ref: 'orders' },
    
}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
// UserSchema.plugin(utils.uuidPlugin);
PaymentSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("payments", PaymentSchema);