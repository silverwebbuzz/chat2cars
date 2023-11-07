"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;

// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }

const ratingAndReviewwSchema = new Schema({

    user: { 
        type: Schema.Types.ObjectId, ref: 'users' 
    },
    seller: { 
        type: Schema.Types.ObjectId, ref: 'users' 
    },
    rating: {
        type: Number,
        default:0,
        required:false
    },
    comment: {
        type: String,
        default:"",
        required:false
    },
}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// UserSchema.plugin(utils.uuidPlugin);
ratingAndReviewwSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("rating_and_review", ratingAndReviewwSchema);