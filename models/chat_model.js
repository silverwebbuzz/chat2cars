"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;

// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }

const ChatSchema = new Schema({
    sender: { 
        type: Schema.Types.ObjectId, ref: 'users' 
    },
    reciever: { 
        type: Schema.Types.ObjectId, ref: 'users' 
    },
    arranger: {
        type: Date, 
        default: Date.now,
        required:false
    },

}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// UserSchema.plugin(utils.uuidPlugin);
ChatSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("chat", ChatSchema);