const express = require('express');
const router = express.Router();
const connection = require('../../util/mysql/mysqldatabase')
const userstable = require('../../util/mysql/userstable')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const key = "LocationPicker"

router.post('/', async (req, res, next) => {
  const { email, password } = req.body
  let conn = await connection.getConnection()
  try {
    let [users, fileds] = await userstable.selectuserfromemail(email)
    if (users.length > 0 && await bcrypt.compare(password, users[0].user_password)) {
      const token = jwt.sign({
        email,
        username: users[0].username
      }, key);
      res.send(
        {
        message: "成功",
        token
      })
    } else {
      throw new Error("帳號或密碼錯誤")
    }
  } catch (error) {
    res.send(error.message)
    console.log(error)


  }
  res.end()
})

module.exports = router