const express = require("express");
const router = express.Router();
const connection = require("../../util/mysql/mysqldatabase");
const googlemapAPi = require("../../util/googlemapapi/googlemapsearch");
const restauranttable = require("../../util/mysql/restauranttable");
const poststable = require('../../util/mysql/posttable')

router.get("/", async (req, res, next) => {
  try {
    let {restaurantid, date } = req.query;
    if (date == undefined || date == "") {
      date = new Date();
    } else {
      date = new Date(date);
    }
    let results = await poststable.getrestaurantPosts(restaurantid, date);
    if (results == null || results == undefined) {
      res.send([]);
      console.log("此餐廳沒有貼文")
      res.status(404);
    } else {
      res.send(results);
      res.status(200);
    }
  } catch (error) {
    console.log(error);
  }
  res.end();
});

module.exports = router;
