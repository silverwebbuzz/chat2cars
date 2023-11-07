"use strict";

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const uuidv4 = require("uuid/v4");
const utils = require("../utils/utils");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;

// @NOTE: geoJSon insert value like this { type: 'Point', coordinates: [-179.0, 0.0] }

const CarsSchema = new Schema({

    title: {
        type: String,
        default:"",
        required:false
    },
    slug: {
        type: String,
        default:"",
        required:false
    },
    creator: { 
      type: Schema.Types.ObjectId, ref: 'users' 
    },
    condition: {
        type: String,
        default:"",
        required:false
    },
    // car_type_id: {
    //     type: String,
    //     default:"",
    //     required:false
    // },
    // brand_id: {
    //     type: Schema.Types.ObjectId, ref: 'car_brands'
    // },
    // model_id: {
    //     type: Schema.Types.ObjectId, ref: 'car_models' 
    // },
    year: {
        type: Number,
        default:0,
        required:false
    },
    bodytype: {
        type: String,
        default:"",
        required:false
    },
    mileage: {
        type: String,
        default:"",
        required:false
    },
    fueltype: {
        type: String,
        default:"",
        required:false
    }, 
    engine: {
        type: String,
        default:"",
        required:false
    },
    transmission: {
        type: String,
        default:"",
        required:false
    },
    drive: {
        type: String,
        default:"",
        required:false
    },
    exteriorcolor: {
        type: String,
        default:"",
        required:false
    },
    interiorcolor: {
        type: String,
        default:"",
        required:false
    },
    vin: {
        type: String,
        default:"",
        required:false
    },
    address: {
        type: String,
        default:"",
        required:false
    },
    latitude: {
        type: Number,
        default:0,
        required:false
    },
    longitude: {
        type: Number,
        default:0,
        required:false
    },

    carfeatures: {
        type: Array,
        default:[],
        required:false
    },

    images: {
        type: Array,
        default:[],
        required:false
    },
    description: {
        type: String,
        default:"",
        required:false
    },
    price: {
        type: Number,
        default:0,
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
    status: {
        type: String,
        default:"",
        required:false
    },
    featured_image: {
        type: String,
        default:"",
        required:false
    },
    make: {
        type: String,
        default:"",
        required:false
    },
    model: {
        type: String,
        default:"",
        required:false
    },    
    clicks: {
        type: Number,
        default:0,
        required:false
    },
    views: {
        type: Array,
        default:[],
        required:false
    },
    featured  : Boolean,
    // is_featured: {
    //     type: String,
    //     enum: ["yes","no"],
    //     default:"no",
    //     required:false,
    // },
    // state: {
    //     type: Schema.Types.ObjectId, ref: 'states'
    // },
    // city: {
    //     type: Schema.Types.ObjectId, ref: 'cities'
    // },
    
}, { strict: true, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// UserSchema.plugin(utils.uuidPlugin);
CarsSchema.on("index", (err) => { console.log(">>>>>>>>>>>>>>>", err); });
module.exports = mongoose.model("cars", CarsSchema);

