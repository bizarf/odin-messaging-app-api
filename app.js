const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const session = require("express-session");

// api route imports
const indexRouter = require("./routes/index");
const welcomeRouter = require("./routes/welcomeRoute");
const userRouter = require("./routes/userRoute");
const authRouter = require("./routes/authRoute");

const app = express();

// dotenv init
require("dotenv").config();
// import the passport js config
require("./middleware/passportConfig");
// import the connect to database function after dotenv init or else it won't be able to access the env variables
const { connectToDatabase } = require("./middleware/mongoConfig");

// connect to database
connectToDatabase().then(() => {
    console.log("Database connected");
});

// init session, passport, and passport session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            // secure: true
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// make express also use cors, compression, and helmet packages
app.use(cors());
app.use(compression());
app.use(helmet());

// express rate limit
const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 50,
    standardHeader: "draft-7",
    legacyHeaders: false,
});
app.use(limiter);

// api routes
app.use("/", indexRouter);
app.use("/api", welcomeRouter);
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send("error");
});

module.exports = app;
