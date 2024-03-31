const express = require('express');
const router = express.Router();
const bycript = require(`bcrypt`)
const connection = require('../../util/mysql/mysqldatabase')
const multer = require('multer');
const path = require('path');
const userstable = require('../../util/mysql/userstable')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './userimage/')
    },
    filename: function (req, file, cb) {
      let {name, ext} = path.parse(file.originalname)
      cb(null, name + "-" + Date.now() + ext)
    }
  })
  const upload = multer({
    storage,
    limits: {
      fileSize: 50 * 1024 * 1024
    },
    fileFilter(req, file, callback) {
      if (!file.mimetype.match(/^image\//)) {
        callback(new Error('檔案格式錯誤'));
      } else {
        callback(null, true);
      }
    },
  });

router.post('/',upload.single('userimage') , async (req, res, next) => {
    const { username, email, password } = req.body
    let url = (req.file !== undefined && req.file !== null) ? `http://10.18.83.80:80/media/${req.file.filename}` : null;
    try {
        let [results, _] = await userstable.selectuserfromemail(email)
        if (results.length > 0) {
            throw new Error('email已被註冊過 請直接登入');
        }
        const hashPassword = await bycript.hash(password, 10)
        let [header, fileds] = await userstable.insertuser(username, url, email, hashPassword)
        res.send("註冊成功")
    } catch (error) {
        res.send(`${error}`)
    }
    res.end()


});

module.exports = router;