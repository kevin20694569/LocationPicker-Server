const express = require("express");
const router = express.Router();
const connection = require("../../util/mysql/mysqldatabase");
const multer = require("multer");
const restaurantstable = require("../../util/mysql/restauranttable");
const shortid = require("short-uuid");
const posttable = require("../../util/mysql/posttable");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./media/");
  },
  filename: function (req, file, cb) {
    const shortUUID = shortid();
    const uuid = shortUUID.new();
    let ext = "";
    switch (file.mimetype) {
      case "image/jpeg":
        ext = ".jpg";
        break;
      case "image/png":
        ext = ".png";
        break;
      case "video/":
        ext = ".mp4";
    }
    cb(null, uuid + ext);
  },
});
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 限制 100 MB
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype.match(/^image|video\//)) {
      callback(new Error("檔案格式錯誤"));
    } else {
      callback(null, true);
    }
  },
});


router.post("/", upload.array(`media`, 5),findRestaurantIDmiddleware, async (req, res, next) => {
  try {

    let files = req.files;

    if (files == undefined) {
      throw new Error("沒有選擇檔案上傳");
    }

    let media_data = [];

    files.forEach((value, index, array) => {
      const dir = `http://10.18.83.80:80/media/${value.filename}`;
      if (req.post_itemtitles[index] == "") {
        req.post_itemtitles[index] = null;
      }
      let object = {
        itemtitle: req.post_itemtitles[index],
        url: dir,
      };
      media_data.push(object);
    });

    let [header, fields] = await posttable.insertNewPost(
      req.post_content,
      JSON.stringify(media_data),
      req.user_id,
      req.restaurant_id
    );
    if (header.serverStatus == 2) {
      res.send("新建Post成功");
      console.log("新建Post成功");
    } else {
      throw new Error("新建Post失敗");
    }
  } catch (error) {
    if (error.message == "找不到地點") {
      res.status(500).send("解析錯誤");
    }
    console.log(error);
  }
  res.end();
});

module.exports = router;

async function findRestaurantIDmiddleware(req, res, next) {
  try {
    let json = JSON.parse(req.body.json);
    let {
      post_content,
      grade,
      post_itemtitles,
      restaurant_name,
      restaurant_address,
      user_id,
    } = json;

    if (restaurant_name == undefined || restaurant_address == undefined) {
      res.status(400);
    }
    if (restaurant_address == undefined) {
      restaurant_address = "";
    }
    if (restaurant_name == undefined) {
      restaurant_name = "";
    }
    console.log(restaurant_name)

    let restaurant_id = await restaurantstable.findrestaurantID(
      restaurant_name,
      restaurant_address
    );
    if (restaurant_id) {
      req.post_content = post_content;
      req.grade = grade;
      req.post_itemtitles = post_itemtitles;
      req.restaurant_name = restaurant_name;
      req.restaurant_address = restaurant_address;
      req.user_id = user_id;
      req.restaurant_id = restaurant_id
      next()
    } else {
      res.status(404).send("找不到地點");
      console.log("找不到地點")
    }
  } catch (error) {
    res.status(404);
    console.log(error);
  }
}
