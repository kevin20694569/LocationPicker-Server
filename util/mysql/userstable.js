const mysql = require("mysql2");
const connection = require("./mysqldatabase");

async function insertuser(username, url, email, hashPassword) {
  var conn = await connection.getConnection();
  try {
    let query = `INSERT INTO users (user_name, user_imageurl, user_email, user_password) VALUES (?, ?, ?, ?)`;
    let params = [username, url, email, hashPassword];
    let [header, _] = await conn.query(query, params);
    conn.release();
    return [header, _];
  } catch (error) {
    conn.release();
    throw error; // 抛出数据库操作相关的错误
  }
}

async function selectuserfromemail(email) {
  var conn = await connection.getConnection();
  try {
    let query = `SELECT user_email FROM users WHERE user_email = ?`;
    let params = [email];
    let [results, fields] = await conn.query(query, params);
    conn.release();

    return [results, fields];
  } catch (error) {
    conn.release();
    throw error; // 抛出错误
  }
}

async function selectuserfromemail(email) {
  try {
    var conn = await connection.getConnection();
    let query = `SELECT * FROM users Where user_email = ?`;
    let params = [email];
    let [results, fields] = await conn.query(query, params);
    conn.release();
    return [results, fields];
  } catch (error) {
    throw error;
  }
}

async function getuserProfile(userid, date) {
    try {
      var conn = await connection.getConnection();
      let postquery = `select posts.post_id as post_ID, posts.created_at,
      posts.media_data_json->'$[0].url' as mediaurl from users
      left join posts on posts.user_id = users.user_id AND posts.created_at < ?
       where users.user_id = ?
       order by posts.created_at desc;`;
      var postparams = [date, userid];
      let [postresults, postfileds] = await conn.query(postquery, postparams);
      let userquery =
        "select user_name, user_imageurl from users where user_id = ?";
      if (postresults[0].post_ID == null) {
        postresults = null;
      }
      let userparams = [userid];
      let [userresults, userfileds] = await conn.query(userquery, userparams);
      conn.release();
      let { user_name, user_imageurl } = userresults[0];
      let json = {
        username: user_name,
        userimageurl: user_imageurl,
        postresults: postresults,
      };
      return json;
    } catch (error) {
      conn.release();
      throw new Error();
    }
  }

module.exports = {
  insertuser,
  selectuserfromemail,
  getuserProfile
};
