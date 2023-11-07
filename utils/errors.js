"use strict";

const ERROR_CODES = {
  AUTH_TOKEN_PRIVATE_KEY_NOT_FOUND: {
    CODE: 50001,
    MESSAGE: "Private key not found for auth token signing"
  },
  AUTH_TOKEN_PUBLIC_KEY_NOT_FOUND: {
    CODE: 50002,
    MESSAGE: "Public key not found for auth token verifying"
  },
  NOT_FOUND: {
    CODE: 404,
    MESSAGE: "Not found"
  },
  UNKNOWN_ERROR: {
    CODE: 999999,
    MESSAGE: "Something went wrong"
  },
  USER_NOT_FOUND: {
    CODE: 999991,
    MESSAGE: "User not found"
  },
  BAD_REQUEST: {
    //USER REQUEST
    ADDITIONAL_PROPERTY:10000,
    INVALID_PASSWORD: 10001,
    EMAIL_TYPE:10002,
    PASSWORD_TYPE:10003,
    EMAIL_REQUIRED:10004,
    PASSWORD_REQUIRED:10005,
    EMAIL1_TYPE:10006,
    FULLNAME:10007,
    PASSWORD1_TYPE:10008,
    EMAIL1_REQUIRED:10009,
    FULLNAME_REQUIRED:10010,
    PASSWORD1_REQUIRED:10011,
    USER_ID_TYPE:10012,
    USER_ID_REQUIRED:10013,
    MOBILE_NUMBER:10014,
    MOBILE_NUMBER_REQUIRED:10015,
    NEW_PASSWORD_REQUIRED:10016,
    NEW_PASSWORD_TYPE:10017,
    CONFIRM_PASSWORD_REQUIRED:10018,
    CONFIRM_PASSWORD_TYPE:10019,
    
    // EVENT REQUEST
    EVENT_TITLE:20000,
    EVENT_TYPE:20001,
    EVENT_TYPE_ENUM:20003,
    USER_ID:20004,
    EVENT_OTHER_TYPE_DESC:20005,
    EVENT_DATE:20005,
    EVENT_VENUE:20006,
    EVENT_THEME:20007,
    EVENT_OTHER_THEME_DESC:20008,
    EVENT_THEME_ENUM:20009,
    EVENT_STATUS_ENUM:20010,
    EVENT_FUNDS:20011,

    // EVENT INVITATION REQUEST
    INVITED_BY:30000,
    INVITATION_STATUS_ENUM:30001,
    INVITED_TO:30002,
    INVITATION_STATUS:30003,
    EVENT_ID:30004,

  },
  INVALID_CONFIRM_PASSWORD: {
    CODE: 40007,
    MESSAGE: "please enter valid confirm password",
  },
  DATABASE_ERROR: {
    USER_EXIST: {
      CODE: 40001,
      MESSAGE: "User already exist"
    },
    INVALID_PASSWORD: {
      CODE: 40002,
      MESSAGE: "Please enter your valid password"
    },
    INVALID_EMAIL_OR_USERNAME:{
      CODE: 40003,
      MESSAGE: "Please enter valid login information"
    },
    USERNAME_EXISTS:{
      CODE: 40004,
      MESSAGE: "Username is already registered"
    },
    EMAIL_EXISTS:{
      CODE: 40005,
      MESSAGE: "Email is already registered"
    },
    USER_ID:{
      CODE: 40006,
      MESSAGE: "This User id already exists"
    },
    MOBILE_NUMBER:{
      CODE:40008,
      MESSAGE: "Mobile number already exists"
    },
    INVITATION_ALREADY_SEND:{
      CODE:40009,
      MESSAGE: "Invitation already send, please invite other user"
    }
  },
  AUTH_TOKEN: {
    REQUIRED: {
      CODE: 41001,
      MESSAGE: "Auth token is required"
    },
    NOT_VALID: {
      CODE: 41002,
      MESSAGE: "Auth token is not valid"
    }
  }
};

const SCHEMA_VALIDATION_ERROR_MESSAGES = {
  PATTERN: {
    PHONE: "Phone should be a string of 9-10 digits",
  },
  TYPE: {
    // USER VALIDATIOM
    PHONE:"Phone should be a string",
    EMAIL:"Username or Email address should be string",
    PASSWORD:"Password should be string",
    EMAIL1:"Email should be string",
    FULLNAME:"Full name should be string",
    PASSWORD1:"Password should be string",
    MOBILE_NUMBER:"Mobile number should be number",
    CONFIRM_PASSWORD:"Confirm password not valid",
    NEW_PASSWORD:"New password not valid",
    // EVENT VALIDATION
    EVENT_TITLE:"Event title should be string",
    USER_ID:"You have an error in User id",
    EVENT_OTHER_TYPE_DESC:"Event other type desc title should be string",
    EVENT_DATE:"Event date should be in Date formate",
    EVENT_VENUE:"Event venue should be string",
    EVENT_THEME:"Event theme not valid",
    EVENT_TYPE:"Event type is not valid",
    EVENT_OTHER_THEME_DESC:"Event other theme desc should be string",
    EVENT_STATUS:"Event status not valid",
    // EVENT INVITATION VALIDATION,
    INVITED_BY:"Invited by should be string",
    INVITED_TO:"Invited To should be string",
    INVITATION_STATUS:"Invitation status should be string",
    EVENT_ID:"Event id should be string",
    EVENT_FUNDS:"Event fund should be Number"
  },
  LENGTH: {
    MIN_LENGTH: {
      FIRST_NAME: "First name length should be greater than 1",
    },
    MAX_LENGTH: {
      FIRST_NAME: "First name length should be smaller than 255",
    }
  },
  REQUIRED: {
    //USER VALIDATION
    FIRST_NAME: "First name is required",
    EMAIL:"Username or Email address is required",
    PASSWORD:"Password is required",
    EMAIL1:"Email address is required",
    FULLNAME:"Fullname is required",
    PASSWORD1:"Password is required",
    USER_ID:"User id is required",
    MOBILE_NUMBER:"Mobile number is required",
    CONFIRM_PASSWORD:"Confirm password is required",
    NEW_PASSWORD:"New password is required",
    //EVENT VALIDATION
    EVENT_TITLE:"Event title is required",
    EVENT_TYPE:"Event type is required",
    EVENT_DATE:"Event date is required",
    //EVENT INVITATION VALIDATION
    INVITED_BY:"Invited by is required",
    INVITED_TO:"Invited To is required",
    INVITATION_STATUS:"Invitation status is required",
    EVENT_ID:"Event id required"

  },
  EXISTS: {
    USER_EMAIL: "Email address is already registered",
  },
  ENUM: {
    GENDER: "Gender is not valid",
    EVENT_TYPE: "Event type is not valid",
    EVENT_THEME:"Event theme is not valid",
    EVENT_STATUS:"Event status is not valid",
    INVITATION_STATUS: "Event invitation status is not valid"
  },
  FORMAT: {
    IMAGE_URL: "Image Url is not valid"
  },
  MIN: {
    LATITUDE: "Min Latitude value is not valid",
  },
  MAX: {
    LATITUDE: "Max Latitude value is not valid",
  },
  UNIQUE: {
    LOOKING_FOR_UNIQUE: "Looking for contains duplicate values",
  },
  UPLOAD_FILE_ERROR: {
    GOV_DOC_PDF_UPLOAD: "Only .pdf file is allowed",
  },
  NOT_FOUND: {
    NO_DATA_AVAILABLE:"No Data Avaialble",
    CODE:10101
  }
};

module.exports = {
  ERROR_CODES: ERROR_CODES,
  SCHEMA_VALIDATION_ERROR_MESSAGES: SCHEMA_VALIDATION_ERROR_MESSAGES
};
