const express = require("express");
const router = express.Router();
const connection = require("../../util/mysql/mysqldatabase");
const googlemapAPi = require("../../util/googlemapapi/googlemapsearch");
const restauranttable = require("../../util/mysql/restauranttable");

router.get("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    let result = await restauranttable.getrestaurant(id)
    if (result == null || result == undefined) {
      res.send([]);
      console.log("找不到餐廳");
      res.status(404);
    } else {
      res.send(result);
      res.status(200);
    }
  } catch (error) {
    console.log(error);
  }
  res.end();
});

module.exports = router;
