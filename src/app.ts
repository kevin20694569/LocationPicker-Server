import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import helmet from "helmet";
import ApiRoute from "./routes/APIRoute";
let apiRoute = new ApiRoute();
var app = express();
app.set("view engine", "ejs");
app.use(helmet());
app.use(cors());
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
console.log(path.join(__dirname, "../public"));
app.use("/restaurantimage", express.static(path.join(__dirname, "../public/media/restaurantimage")));
app.use("/userimage", express.static(path.join(__dirname, "../public/media/userimage")));
app.use("/media", express.static(path.join(__dirname, "../public/media/postmedia")));

app.use("/", apiRoute.router);

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
  console.log(err);
  res.send({ erroMessage: "Error" });
  res.status(err.status || 500);

  res.end();
  // res.render("error");
});

module.exports = app;
