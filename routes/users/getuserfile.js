const express = require("express");
const router = express.Router();
const usertable = require("../../util/mysql/userstable");

router.get("/:id", async (req, res, next) => {
  let id = req.params.id;
  let { date } = req.query;
  if (date == undefined || date == "" || date == null) {
    date = new Date();
  } else {
    date = new Date(date);
  }
  
  try {
    let results = await usertable.getuserProfile(id, date);
    if (results.length <= 0) {
      res.send("獲取user失敗");
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
