const Bluebird = require("bluebird");
const nodemailer = require('nodemailer');
const path = require("path");
const fs = require("fs");
const handlebars = require('handlebars');
const User = require("../models/users");
//const EmailTemplate =
//const EmailTemplate = require("../utils/email-templates"); 
//const EmailTemplate = require('email-templates').EmailTemplate;
const utils = require("../utils/utils");
const constants = require("../utils/constants");
//const pushNotification = require("../utils/push-notification");
//const AppLanguage = require("../models/app-language");
//const userSettings = require("../models/user-settings");  
var smtpPool = require('nodemailer-smtp-pool'); 



const sendTestEmail = function (data) {
	return Bluebird.try(() => {
		nodemailer.createTestAccount((err, account) => {
		    // let transporter = nodemailer.createTransport({
		    //     host: 'smtp.gmail.com',
		    //     port: 587,
		    //     secure: false, 
		    //     auth: {
		    //         user: "akshayboricha5@gmail.com",
		    //         pass: "boricha123"
		    //     }
			// });
			var transporter = nodemailer.createTransport(smtpPool({
				service: 'gmail',
				auth: {
					user: constants.DEFAULT_EMAIL_SETTINGS.EMAIL,
					pass: constants.DEFAULT_EMAIL_SETTINGS.PASSWORD
				},
				maxConnections: 5,
				maxMessages: 10
			  }));
			  
			let filePath = path.join(__dirname, "..", 'email-templates/test.html');
			utils.readHTMLFile(filePath, function(err, html) {
			    let template = handlebars.compile(html);
			    let replacements = {
			         username: "sdfsdff asdasd",
			         name:"Bhargav",
			         SITE_URL:process.env.WEBSITE_URL
			    };
			    
			    let htmlToSend = template(replacements);
			    
			    let mailOptions = {
			        from: '"Chat2Cars" - <'+constants.SITE_EMAIL_ADDRESS+'>',
					to: data.to_email,
			        subject: data.subject,
			        html: htmlToSend
				};
				
				console.log("mail option : ",mailOptions);

			    transporter.sendMail(mailOptions, function (error, response) {
			        if (error) {
			            console.log(error);
			            
			        }
			    });
			});
		});
	});
};

const sendRegisterSuccessEmail = function(email,userId){
	let FromUserName = 'Chat2cars';
	nodemailer.createTestAccount((err, account) => {
		var transporter = nodemailer.createTransport(smtpPool({
			//host: 'email-smtp.us-east-1.amazonaws.com',
			//port: 465, 
			//secure: true, 
			host: constants.DEFAULT_EMAIL_SETTINGS.HOST,
			port: constants.DEFAULT_EMAIL_SETTINGS.PORT,
			secure: constants.DEFAULT_EMAIL_SETTINGS.SECURE,
			auth: {
				user: constants.DEFAULT_EMAIL_SETTINGS.EMAIL,
				pass: constants.DEFAULT_EMAIL_SETTINGS.PASSWORD
			},
			maxConnections: 5,
			maxMessages: 10
		  }));
		let filePath = path.join(__dirname, "..", 'email-templates/emailRegisterSuccessfull.html');
		let description_text;
		let title;
		description_text = constants.APP_LANGUAGE_CONSTANTS.en.USER_REGISTER_SUCCESS_MAIL_TEXT; 
		utils.readHTMLFile(filePath, function(err, html) {
			let template = handlebars.compile(html);
			let replacements = {
					title: description_text,
					click_here: 'Click here to verify your acount',
					VerificationUrl: process.env.WEBSITE_URL+"user/verify/"+userId
			};
			let htmlToSend = template(replacements);
			let mailOptions;
            mailOptions = {
                from: constants.SITE_EMAIL_ADDRESS,
                to: email,
                subject: constants.APP_LANGUAGE_CONSTANTS.en.EMAIL_FROM_SUBJECT_USER_REGISTERED,
               	html: htmlToSend
			};
			
			transporter.sendMail(mailOptions, function (error, response, callback) {
				if (error) {
					console.log(error);
					callback(error);
				} 
				if (response) {
					console.log(response);
					callback(response);
				}
			});
		});
	});
};

const sendContactUsMail = function(contactUsdata){
	let FromUserName = 'Chat2cars';
	nodemailer.createTestAccount((err, account) => {
		console.log();
		var transporter = nodemailer.createTransport(smtpPool({
			//host: 'email-smtp.us-east-1.amazonaws.com',
			//port: 465, 
			//secure: true, 
			host: constants.DEFAULT_EMAIL_SETTINGS.HOST,
			port: constants.DEFAULT_EMAIL_SETTINGS.PORT,
			secure: constants.DEFAULT_EMAIL_SETTINGS.SECURE,
			auth: {
				user: constants.DEFAULT_EMAIL_SETTINGS.EMAIL,
				pass: constants.DEFAULT_EMAIL_SETTINGS.PASSWORD
			},
			maxConnections: 5,
			maxMessages: 10
		  }));
		let filePath = path.join(__dirname, "..", 'email-templates/emailContactUs.html');
		utils.readHTMLFile(filePath, function(err, html) {
			let template = handlebars.compile(html);
			let replacements = {
					subject: contactUsdata.subject,
					email: contactUsdata.email,
					number: contactUsdata.mobile_number,
					message: contactUsdata.message,
					fullname: contactUsdata.fullname,
			};
			let htmlToSend = template(replacements);
			let mailOptions;
            mailOptions = {
                from: constants.SITE_EMAIL_ADDRESS,
                to: 'info@chat2cars.co.za',
                subject: constants.APP_LANGUAGE_CONSTANTS.en.EMAIL_FROM_SUBJECT_USER_CONTACT_US,
               	html: htmlToSend
			};
			transporter.sendMail(mailOptions, function (error, response, callback) {
				if (error) {
					console.log(error);
					callback(error);
				} 
				if (response) {
					console.log(response);
					callback(response);
				}
			});
		});
	});
};

const sendForgotPasswordMail = function(userData){
	let FromUserName = 'Chat2cars';
	nodemailer.createTestAccount((err, account) => {
		var transporter = nodemailer.createTransport(smtpPool({
			//host: 'email-smtp.us-east-1.amazonaws.com',
			//port: 465, 
			//secure: true, 
			host: constants.DEFAULT_EMAIL_SETTINGS.HOST,
			port: constants.DEFAULT_EMAIL_SETTINGS.PORT,
			secure: constants.DEFAULT_EMAIL_SETTINGS.SECURE,
			auth: {
				user: constants.DEFAULT_EMAIL_SETTINGS.EMAIL,
				pass: constants.DEFAULT_EMAIL_SETTINGS.PASSWORD
			},
			maxConnections: 5,
			maxMessages: 10
		  }));
		let filePath = path.join(__dirname, "..", 'email-templates/emailForgotPassword.html');
		let description_text;
		let title;
		description_text = 'Hello '+userData.fullname+ ' Please click below link to reset your password'; 
		utils.readHTMLFile(filePath, function(err, html) {
			let template = handlebars.compile(html);
			let replacements = {
					title: description_text,
					click_here: 'Click here to reset your password',
					VerificationUrl: process.env.WEBSITE_URL+"reset-password/"+userData.forgot_password_str
			};
			let htmlToSend = template(replacements);
			let mailOptions;
            mailOptions = {
                from: constants.SITE_EMAIL_ADDRESS,
                to: userData.email,
                subject: 'Chat2cars Reset Password Link',
               	html: htmlToSend
			};
			
			transporter.sendMail(mailOptions, function (error, response, callback) {
				if (error) {
					console.log(error);
					callback(error);
				} 
				if (response) {
					console.log(response);
					callback(response);
				}
			});
		});
	});
};


const sendEnquiryEmail = function(enquiryData){
	
	let FromUserName = 'Chat2cars';
	nodemailer.createTestAccount((err, account) => {
		var transporter = nodemailer.createTransport(smtpPool({
			//host: 'email-smtp.us-east-1.amazonaws.com',
			//port: 465, 
			//secure: true,
			host: constants.DEFAULT_EMAIL_SETTINGS.HOST,
			port: constants.DEFAULT_EMAIL_SETTINGS.PORT,
			secure: constants.DEFAULT_EMAIL_SETTINGS.SECURE,
			auth: {
				user: constants.DEFAULT_EMAIL_SETTINGS.EMAIL,
				pass: constants.DEFAULT_EMAIL_SETTINGS.PASSWORD
			}, tls: {
				rejectUnauthorized: false
			},
			maxConnections: 5,
			maxMessages: 10
		  }));
		  let filePath = path.join(__dirname, "..", 'email-templates/carEnquiryMail.html');
		utils.readHTMLFile(filePath, function (err, html) {
			let template = handlebars.compile(html);
			let replacements = {
				email: enquiryData.email,
				subject: enquiryData.subject,
				number: enquiryData.gsm,
				message: enquiryData.message,
				name: enquiryData.name,
				imagepath: enquiryData.imagepath,
				url: 'https://chat2cars.co.za/' + 'listing/' + enquiryData.slug
			};
			  let htmlToSend = template(replacements);
			  let mailOptions;
			  mailOptions = {
				
					from:constants.SITE_EMAIL_ADDRESS,
					to: enquiryData.to,		
				    cc: constants.Cc_EMAIL, 
					subject: 'Chat2Cars - '+enquiryData.subject, // Subject line
					html: htmlToSend
			  };
			 
			transporter.sendMail(mailOptions, function (error, response, callback) {
					
				if (error) {
					console.log(error);
					callback(error);
				} 
				if (response) {
					console.log(response);
					callback(response);
				}
			});
		});
	});
};

const sendSubscriptionExpiryEmail = function(mailOptions){
	nodemailer.createTestAccount((err, account) => {
		
		var transporter = nodemailer.createTransport(smtpPool({
			//host: 'email-smtp.us-east-1.amazonaws.com',
			//port: 465, 
			//secure: true, 
			host: constants.DEFAULT_EMAIL_SETTINGS.HOST,
			port: constants.DEFAULT_EMAIL_SETTINGS.PORT,
			secure: constants.DEFAULT_EMAIL_SETTINGS.SECURE,
			auth: {
				user: constants.DEFAULT_EMAIL_SETTINGS.EMAIL,
				pass: constants.DEFAULT_EMAIL_SETTINGS.PASSWORD
			},
			maxConnections: 10,
			maxMessages: 10
		}));
		transporter.sendMail(mailOptions, function (error, response, callback) {
			if (error) {
				console.log(error);
				callback(error);
			} 
			if (response) {
				console.log(response);
				callback(response);
			}
		});
	});
};

const sendSubscriptionOrderEmail = function(mailOptions){
	nodemailer.createTestAccount((err, account) => {
		
		var transporter = nodemailer.createTransport(smtpPool({
			//host: 'email-smtp.us-east-1.amazonaws.com',
			//port: 465, 
			//secure: true, 
			host: constants.DEFAULT_EMAIL_SETTINGS.HOST,
			port: constants.DEFAULT_EMAIL_SETTINGS.PORT,
			secure: constants.DEFAULT_EMAIL_SETTINGS.SECURE,
			auth: {
				user: constants.DEFAULT_EMAIL_SETTINGS.EMAIL,
				pass: constants.DEFAULT_EMAIL_SETTINGS.PASSWORD
			},
			maxConnections: 10,
			maxMessages: 10
		}));
		transporter.sendMail(mailOptions, function (error, response, callback) {
			if (error) {
				console.log(error);
				callback(error);
			} 
			if (response) {
				console.log(response);
				callback(response);
			}
		});
	});
};

const sendSubscriptionOrderCanceledEmail = function(mailOptions){
	nodemailer.createTestAccount((err, account) => {
		var transporter = nodemailer.createTransport(smtpPool({
			//host: 'email-smtp.us-east-1.amazonaws.com',
			//port: 465, 
			//secure: true, 
			host: constants.DEFAULT_EMAIL_SETTINGS.HOST,
			port: constants.DEFAULT_EMAIL_SETTINGS.PORT,
			secure: constants.DEFAULT_EMAIL_SETTINGS.SECURE,
			auth: {
				user: constants.DEFAULT_EMAIL_SETTINGS.EMAIL,
				pass: constants.DEFAULT_EMAIL_SETTINGS.PASSWORD
			},
			maxConnections: 10,
			maxMessages: 10
		}));
		transporter.sendMail(mailOptions, function (error, response, callback) {
			if (error) {
				console.log(error);
				callback(error);
			} 
			if (response) {
				console.log(response);
				callback(response);	
			}
		});
	});
};

const defaultMailSend = function(mailOptions){
	nodemailer.createTestAccount((err, account) => {
		let transporter = nodemailer.createTransport(smtpPool({
			//host: 'email-smtp.us-east-1.amazonaws.com',
			//port: 465, 
			//secure: true, 
			host: constants.DEFAULT_EMAIL_SETTINGS.HOST,
			port: constants.DEFAULT_EMAIL_SETTINGS.PORT,
			secure: constants.DEFAULT_EMAIL_SETTINGS.SECURE,
			auth: {
				user: constants.DEFAULT_EMAIL_SETTINGS.EMAIL,
				pass: constants.DEFAULT_EMAIL_SETTINGS.PASSWORD
			}
		}));
		transporter.sendMail(mailOptions, function (error, response, callback) {
			if (error) {
				console.log(error);
				callback(error);
			}else{
				console.log("response",response);
				callback(response);
			}
		});
	});
};

		
		
const sendAppointmentMail = function(appointmentData){
	let FromUserName = 'Chat2cars';
	nodemailer.createTestAccount((err, account) => {
		console.log();
		var transporter = nodemailer.createTransport(smtpPool({
			//host: 'email-smtp.us-east-1.amazonaws.com',
			//port: 465, 
			//secure: true, 
			host: constants.DEFAULT_EMAIL_SETTINGS.HOST,
			port: constants.DEFAULT_EMAIL_SETTINGS.PORT,
			secure: constants.DEFAULT_EMAIL_SETTINGS.SECURE,
			auth: {
				user: constants.DEFAULT_EMAIL_SETTINGS.EMAIL,
				pass: constants.DEFAULT_EMAIL_SETTINGS.PASSWORD
			},
			maxConnections: 5,
			maxMessages: 10
			}));
			let filePath = path.join(__dirname, "..", 'email-templates/appointmentMail.html');
			utils.readHTMLFile(filePath, function(err, html) {
				let template = handlebars.compile(html);
				let replacements = {
					fullname: appointmentData.fullname,
					address1: appointmentData.address1,
					address2: appointmentData.address2,
					email: appointmentData.email,
					date_of_birth: appointmentData.date_of_birth,
					mobile_number:appointmentData.mobile_number,
					country_code: appointmentData.country_code,
					country: appointmentData.country,
					state: appointmentData.state,
					city: appointmentData.city,
					reason: appointmentData.reason,
					date: appointmentData.date,
					time: appointmentData.time

				};
				let htmlToSend = template(replacements);
				let mailOptions;
				mailOptions = {
					from: constants.SITE_EMAIL_ADDRESS,
					to: constants.SITE_EMAIL_ADDRESS,
					subject: 'Chat2Cars - Appointment Mail', // Subject line
					html: htmlToSend
				};
			transporter.sendMail(mailOptions, function (error, response, callback) {
				if (error) {
					console.log(error);
					callback(error);
				} 
				if (response) {
					console.log(response);
					callback(response);
				}
			});
		});
	});
};


module.exports = {
	sendTestEmail:sendTestEmail,
	sendRegisterSuccessEmail:sendRegisterSuccessEmail,
	sendContactUsMail:sendContactUsMail,
	sendForgotPasswordMail:sendForgotPasswordMail,
	sendEnquiryEmail:sendEnquiryEmail,
	sendSubscriptionExpiryEmail:sendSubscriptionExpiryEmail,
	sendSubscriptionOrderEmail:sendSubscriptionOrderEmail,
	sendSubscriptionOrderCanceledEmail:sendSubscriptionOrderCanceledEmail,
	defaultMailSend:defaultMailSend,
	sendAppointmentMail:sendAppointmentMail
};