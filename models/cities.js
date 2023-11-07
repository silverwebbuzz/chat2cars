"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;
// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }
const CitiesSchema = new Schema({
    city_name: {
        type: String,
        default:"",
        required:false
    },
    state: {
        type: Schema.Types.ObjectId, ref: 'states'
    },
    lat: {
        type: Number,
        default:0,
        required:false
    },
    lng: {
        type: Number,
        default:0,
        required:false
    },
}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
// UserSchema.plugin(utils.uuidPlugin);
CitiesSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("cities", CitiesSchema);