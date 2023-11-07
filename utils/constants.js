'user strict';

const PHONE_REGEX = '^[0-9]{9,10}$';
const LENGTHS = {
	FIRST_NAME: {
		MIN: 1,
		MAX: 255
	},
	LAST_NAME: {
		MIN: 1,
		MAX: 255
	},
	OTP: {
		MIN: 4,
		MAX: 4
	},
	USER_DETAILS: {
		MIN: 1,
		MAX: 255
	},
	INTRUSTED_IN: {
		MIN: 1,
		MAX: 255
	}
};

//constants to define ENUM
const EVENT_TYPE = [ 'birthday', 'marraige', 'other' ];
const EVENT_THEME = [ 'horror', 'other' ];
const EVENT_STATUS = [ 'open', 'closed', 'cancelled' ];
const INVITATION_STATUS = [ 'accepted', 'rejected', 'not seen', 'seen' ];

// constants to define PAGINATION
const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 50;

// this is the name of place holder image this image will be in root of public folder
const PLACEHOLDER_IMAGE = 'placeholder-150x150.png';

const UPLOAD_DIR_PATH = {
	USER_IMAGE: 'public/user-images',
	CARS_IMAGES: 'public/cars-images/',
	BLOG_IMAGES: 'public/blog-images/',
	COMPRESSED_CAR_IMAGES: 'public/compressed-car-images/',
	TEST_FOLDER: 'public/test-folder/',
};

const PLACE_HOLDER_IMAGES = {
	USER_PLACEHOLDER: 'avatar.png', 
  	DEFAUT_PLACEHOLDER: 'defaut-placeholder.png',
	CARS_PLACEHOLDER: 'car_placeholder.jpeg',
};

const SSH_PASSWORD_KEY = '198a38074880a9c67ace9c865eeeb0c8';
const BASE_IMAGE_UPLOAD_PATH = 'public/images';
//const BASE_IMAGE_UPLOAD_PATH = "../images-outside";
const COMMON_MESSAGES = {
	USER_FOUND: 'User data found',
	USER_DETAILS_UPDATED: 'User details updated',
	USER_DELETED: 'User Successfully Deleted',
	USER_CREATED: 'User Successfully Created',
	USER_VERIFIED: 'Your account has been verified successfully',
	USER_PASSWORD_UPDATED: 'Your password has been updated successfully',
	CONFIRM_PASSWORD_NOT_VALID: 'please enter valid confirm password',
	DATA_NOT_FOUND: 'No data available',
	DATA_FOUND: 'data available',
	DATA_UPDATED: 'Data Updated Successfull',
	STUDENT_CREATED: 'Student Added Successfull',
	STUDENT_ROLL_NO_EXIST: 'Student Roll No Already Exist',
	DATA_DELETED: 'Data Deleted Successfully',
	EMAIL_EXIST: 'Email Already Exist',
	ADD_SUBSCRIPTION: 'Subcription Added Successfull',
	ADD_CAR: 'Car Added Successfull',
	ADD_CAR_BRAND: 'Car Brand Added Successfull',
	ADD_CAR_MODEL: 'Car Model Added Successfull',
	ADD_CAR_TYPE: 'Car Type Added Successfull',
	LIKE_CAR: 'Car Liked Successfull',
	BOOK_TEST_DRIVE: 'Your Test Drive Booked Successfull',
	CONTACT_US_EMAIL_SAVED: 'Thank You For Contacting Us, Your Mail Has Been Recieved',
};

const COMMON_MESSAGES_ClASS = {
	CLASS_UPDATE: 'Class data update  successfully'
};

const COMMON_ERROR_MESSAGES = {
	DEFAULT_ERROR: 'Something went Wrong , Please try again'
};

const CARD_SAVED_MESSAGE = {
	SAVED: 'Your card has been saved'
};

const COMMON_EVENT_MESSAGE = {
	DATA_FOUND: 'Data available',
	EVENT_CREATED: 'Event created successfull',
	DATA_NOT_FOUND: 'No data available',
	EVENT_DETAILS_UPDATED: 'Event details updated',
	EVENT_DELETED: 'Event Successfull Deleted',

	EVENT_INVITATION_SAVED: 'Invitation Send Successfull',
	INVITATION_ALREADY_SEND: 'Invitation has already sended, Please invite other users',
	EVENT_INVITATIONS_DELETED: 'All the event invitations has been deleted',
	NO_INVITES: "You didn't Invited anyone yet"
};

// const DEFAULT_EMAIL_SETTINGS = {
//   "EMAIL":"akshay.devstree@gmail.com",
//   "PASSWORD":"Akshay@2018"
// };

const DEFAULT_EMAIL_SETTINGS = {
	EMAIL:"chat2cars.co.za@gmail.com",
	PASSWORD:"dihpydwirbxrupof",
	HOST:"smtp.gmail.com",
	PORT:587,
	SECURE: false,
	
	
	
	 //EMAIL:"kamal@silverwebbuzz.com",
	 //PASSWORD:"Silver@306",
	 //HOST:"mail.silverwebbuzz.com",
	 //PORT:465,
	 //SECURE: true,
	
	// New Credential
	//EMAIL: 'AKIA6Q2P5IB2QH3F4BU2',
	//PASSWORD: 'BNxRWjp9EWvpIVLPE9PpdMnyqhQvUP+RVtxAnZC6vh1I',
	//HOST: 'email-smtp.us-east-1.amazonaws.com',
	//PORT: 465,
	//SECURE: false,

};
const Cc_EMAIL = 'chat2cars.co.za@gmail.com';



const ADMIN_EMAIL = {
	EMAIL: 'akshay.devstree@gmail.com'
};

//const SITE_EMAIL_ADDRESS = 'info@chat2cars.co.za';
const SITE_EMAIL_ADDRESS = 'chat2cars.co.za@gmail.com';
//const SITE_EMAIL_ADDRESS = 'chat2carsapp@outlook.com';

const APP_LANGUAGE_CONSTANTS = {
	en: {
		EMAIL_FROM_USERNAME: 'Chat2cars',
		EMAIL_FROM_SUBJECT_PROFILE_VIEW: 'Chat2cars',
		PLEASE_ENTER_CORRECT_OLD_PASSWORD: 'Please enter correct old password',
		PASSWORD_AND_CONFIRM_PASSWORD_SHOULD_MATCH: 'New Password and confirm password should match',
		PASSWORD_CHANGES_SUCCESSFULLY: 'Your password has been changed successfully',
		NEW_PASSWORD_SHOULD_NOT_BE_BLANK: 'New password should not be blank',
		NOT_REGISTERED_EMAIL_ADDRESS: 'Please enter your valid registered email address',
		EMAIL_SUCCESSFULL_SENT:
			'A new password has been sent to your email address.Please login with your new password',
		EMAIL_FROM_SUBJECT_FORGOT_PASSWORD: 'Set your password for Chat2cars photography',
		RANDOM_PASSWORD_TEXT: 'Please Click the link to set your password',
		USER_REGISTER_SUCCESS_MAIL_TEXT: 'Thank You For Registering',
		EMAIL_FROM_SUBJECT_USER_REGISTERED: 'Successfully Registered To Chat2cars',

		EMAIL_FROM_SUBJECT_USER_CONTACT_US: 'Contact Us Mail Recieved From Chat2car Site',

		PASSWORD_CHANGES_SUCCESSFULLY: 'Your password has been changed successfully',
		NEW_PASSWORD_SHOULD_NOT_BE_BLANK: 'New password should not be blank',
		PASSWORD_AND_CONFIRM_PASSWORD_SHOULD_MATCH: 'New Password and confirm password should match',
		PLEASE_ENTER_CORRECT_OLD_PASSWORD: 'Please enter correct old password',
		SENDTHANKYOUMAIL: 'Thank you for contacting us, We have recieved you message',
		MAIL_BY_Marce_CONTACT_US: 'Chat2cars contact us mail'
	}
};

module.exports = {
	PHONE_REGEX: PHONE_REGEX,
	LENGTHS: LENGTHS,
	PLACEHOLDER_IMAGE: PLACEHOLDER_IMAGE,
	DEFAULT_OFFSET: DEFAULT_OFFSET,
	DEFAULT_LIMIT: DEFAULT_LIMIT,
	UPLOAD_DIR_PATH: UPLOAD_DIR_PATH,
	SSH_PASSWORD_KEY: SSH_PASSWORD_KEY,
	BASE_IMAGE_UPLOAD_PATH: BASE_IMAGE_UPLOAD_PATH,
	COMMON_MESSAGES: COMMON_MESSAGES,
	DEFAULT_EMAIL_SETTINGS: DEFAULT_EMAIL_SETTINGS,
	APP_LANGUAGE_CONSTANTS: APP_LANGUAGE_CONSTANTS,
	COMMON_ERROR_MESSAGES: COMMON_ERROR_MESSAGES,
	COMMON_EVENT_MESSAGE: COMMON_EVENT_MESSAGE,
	CARD_SAVED_MESSAGE: CARD_SAVED_MESSAGE,
	ADMIN_EMAIL: ADMIN_EMAIL,
	EVENT_TYPE: EVENT_TYPE,
	EVENT_THEME: EVENT_THEME,
	EVENT_STATUS: EVENT_STATUS,
	INVITATION_STATUS: INVITATION_STATUS,
  PLACE_HOLDER_IMAGES: PLACE_HOLDER_IMAGES,
  SITE_EMAIL_ADDRESS:SITE_EMAIL_ADDRESS,
  Cc_EMAIL: Cc_EMAIL
};
