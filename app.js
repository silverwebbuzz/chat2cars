"use strict";
const compression = require('compression');
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const CustomError = require("./utils/custom-error");
const ERRORS = require("./utils/errors").ERROR_CODES;
const logger = require("./utils/logger");

const adminRoutes = require("./routes/admin_master");
const usersRoutes = require("./routes/users");
const carsRoutes = require("./routes/cars");
const blogRoutes = require("./routes/blogs");
const appointmentsRoutes = require("./routes/appointments");
const cityStateRoutes = require("./routes/city_state");
const contactUs = require("./routes/contact_us");
const commonRoutes = require("./routes/common_routes");
const chatRoutes = require("./routes/chat");

//const indexFile = require("./routes/index");


const userImageUploadDirPath = path.join(__dirname, "public/user-images");

if (!fs.existsSync(userImageUploadDirPath)) {
  fs.mkdirSync(userImageUploadDirPath);
}

const options = {
  promiseLibrary: require("bluebird"),
  poolSize: 3,
  connectTimeoutMS: 1000,
  reconnectInterval: 5000,
  logger,
  autoReconnect: true,
  useNewUrlParser: true
};

const connectWithRetry = function () {
  return mongoose.connect(process.env.MONGODB_URL, options, (err) => {
    if (err) {
      logger.error("Failed to connect to mongo on startup - retrying in 5 sec", err);
      setTimeout(connectWithRetry, 5000);
    }
  });
};
connectWithRetry();

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on("connected", () => {
  logger.log(`Mongoose default connection open to ${process.env.MONGODB_URL}`);
  logger.info("Mongoose default connection open");
});

// If the connection throws an error
mongoose.connection.on("error", (err) => {
  logger.info("Mongoose default connection error", err);
});

// When the connection is disconnected
mongoose.connection.on("disconnected", () => {
  logger.error("Mongoose default connection disconnected");
  //  connectWithRetry();
});

// When the connection is reconnected
mongoose.connection.on("reconnected", () => {
  logger.info("Mongoose default connection reconnected");
});

// If the Node process ends, close the Mongoose connection
process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    logger.info("Mongoose default connection disconnected through app termination");
    process.exit(0);
  });
});

const app = express();

app.use(compression());

const server = require("http").createServer(app);

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  //res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// Enable helmet
app.use(helmet());
app.use(helmet.noCache());

// Enable CORS
app.use(cors());

// Enable CORS for verbs other than GET/HEAD/POST
app.options("*", cors());


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// app.use(fileUpload());
// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser({limit: '500mb'}))
// app.use(logger("dev"));

//Limit file size: 52428800


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Print req parameters
const requestLogger = function (req, res, next) {
  if (req.query && Object.keys(req.query).length > 0) {
    logger.log("REQUEST QUERY PARAMETERS: ", req.query);
  }

  if (req.params && Object.keys(req.params).length > 0) {
    logger.log("REQUEST PARAMS: ", req.params);
  }

  if (req.body && Object.keys(req.body).length > 0) {
    logger.log("REQUEST BODY PARAMETERS: ", req.body);
  }

  return next();
};

app.use(requestLogger);
app.get("/", (req, res) => res.sendFile(__dirname + "/views/index.html"));

app.get("/.well-known/acme-challenge/sFzkB2KPb7gfAyC8VwSu7SFbWgfw94w-uPOJ8QAaNaY", (req, res) => {
  return res.status(200).send('sFzkB2KPb7gfAyC8VwSu7SFbWgfw94w-uPOJ8QAaNaY._O7jD7qmbuoVJCo23ppBRcCNWwfhsANgx7h0tR6U4i0');
});



// ROUTES

app.use("/api/v1/admin_master", adminRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/cars", carsRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/appointments", appointmentsRoutes);
app.use("/api/v1/city_state", cityStateRoutes);
app.use("/api/v1/contact_us", contactUs);
app.use("/api/v1/common", commonRoutes);
app.use("/api/v1/chat", chatRoutes);



//app.use("/chat", indexFile);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = CustomError._404(ERRORS.NOT_FOUND.CODE, "Not Found");
  // err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // res.status(err.status || 500);
  logger.log(err);
  return res.status(err.statusCode || 500).json({
    errorCode: err.errorCode || ERRORS.UNKNOWN_ERROR.CODE,
    reason: err.statusCode === 500 ? "Something went wrong" : err.message,
    success: false,
  });
});

module.exports = {
  app,
  server,
};
