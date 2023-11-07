"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;

// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }

const MakesSchema = new Schema({

    creator   : { type: Schema.Types.ObjectId, ref: 'Users' },
    maketitle : String,
    models    : Array,
    status    : String,
    date      : String,
    arranger  : { type: Date, default: Date.now },
    
    
}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// UserSchema.plugin(utils.uuidPlugin);
MakesSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("makes", MakesSchema);

