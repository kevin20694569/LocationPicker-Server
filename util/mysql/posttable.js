const mysql = require("mysql2");
const fs = require("fs");
const connection = require("./mysqldatabase");

async function getPostByID(id) {
  var conn = await connection.getConnection();
  let query = `select * from posts where post_id = ?`;
  let params = [id];
  let [data, fields] = await conn.query(query, params);
  conn.release();
  return data;
}

async function insertNewPost(post_content, media_data, user_id, restaurant_id) {
  var conn = await connection.getConnection();
  let query = `insert into posts ( post_content, media_data_json, user_id, restaurant_id) VALUES(?, ?, ?, ?);`;
  let params = [post_content, media_data, user_id, restaurant_id];
  let [header, fields] = await conn.query(query, params);
  conn.release();
  return [header, fields];
}

async function getnearlocactionPost(
  latitude,
  longitude,
  offset,
  lastrestaurantid
) {
  var conn = await connection.getConnection();
  let query = `select subquery.* , restaurants.restaurant_name, restaurants.restaurant_address , users.user_name, users.user_imageurl,  ST_DISTANCE(POINT(restaurants.restaurant_longitude, restaurants.restaurant_latitude), POINT(?, ?)) AS distance FROM (SELECT *,ROW_NUMBER() OVER (PARTITION BY restaurant_id ORDER BY RAND()) as rn FROM posts ) AS subquery LEFT JOIN restaurants ON restaurants.restaurant_id = subquery.restaurant_id  Left join users on users.user_id =  subquery.user_id WHERE rn = 1 AND restaurants.restaurant_id IS NOT NULL AND ST_DISTANCE(POINT(restaurants.restaurant_longitude, restaurants.restaurant_latitude), POINT(?, ?)) > ? AND restaurants.restaurant_id != ? ORDER BY distance limit 3;`;

  if (offset) {
    var params = [
      longitude,
      latitude,
      longitude,
      latitude,
      offset,
      lastrestaurantid,
    ];
  } else {
    var params = [longitude, latitude, longitude, latitude, 0, ""];
  }
  let [results, fileds] = await conn.query(query, params);
  conn.release();
  return results;
}

async function getrestaurantPosts(restaurant_id, Date) {
  try {
  var conn = await connection.getConnection();
  let query = `select 
  posts.*,
  users.user_id,
  users.user_name,
  users.user_imageurl
  from restaurants
  left join posts on posts.restaurant_id = restaurants.restaurant_id 
  left join users on posts.user_id = users.user_id
  where restaurants.restaurant_id = ? AND posts.created_at < ?
  order by posts.created_at desc
  limit 18;`;
  var params = [restaurant_id, Date];
  let [results, fileds] = await conn.query(query, params);
  conn.release()
  return results
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  getrestaurantPosts,
  getnearlocactionPost,
  insertNewPost,
  getPostByID,
};
