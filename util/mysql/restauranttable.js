const mysql = require("mysql2");
const fs = require("fs");
const connection = require("./mysqldatabase");
var googlemap = require("../googlemapapi/googlemapsearch");
const axios = require("axios");
const { error } = require("console");

async function findrestaurantID(locationname, address) {
  try {
    var conn = await connection.getConnection();
    let { place_id, name, formatted_address, geometry, lat, lng, photos } =
      await restaurantsearchfromgoogle(locationname, address);
    let { photo_reference } = photos[0];
    if (place_id == undefined || place_id == null) {
      throw new Error("找不到地點");
    }
    let query = `select * from restaurants where restaurant_id = ?;`;
    let params = [place_id];
    let [results, fileds] = await connection.query(query, params);

    if (results.length > 0) {
      conn.release();
      return results[0].restaurant_id;
    } else {
      let imageurl = await googlemap.downloadPhoto(photo_reference, place_id);
      let [results, fileds] = await createnewrestaurant(
        place_id,
        name,
        formatted_address,
        lat,
        lng,
        imageurl
      );
      conn.release();
      if (results.serverStatus == 2) {
        return place_id;
      } else {
        throw new Error("新建餐廳失敗");
      }
    }
  } catch (error) {
    throw error;
  }
}

async function restaurantsearchfromgoogle(locationname, address) {
  let querry = `${locationname},${address}`;
  let result = await googlemap.searchPlacesByText(querry);
  let { place_id, name, formatted_address, geometry, photos } = result;
  let { lat, lng } = geometry.location;
  return { place_id, name, formatted_address, geometry, lat, lng, photos };
}

async function createnewrestaurant(
  place_id,
  name,
  formatted_address,
  lat,
  lng,
  imageurl
) {
  var conn = await connection.getConnection();
  let query = `insert into restaurants (restaurant_id, restaurant_name, restaurant_address, restaurant_latitude, restaurant_longitude, restaurant_imageurl) VALUES(?, ?, ?, ?, ?, ?);`;
  let params = [place_id, name, formatted_address, lat, lng, imageurl];
  const [results, fileds] = await conn.query(query, params);
  conn.release();

  return [results, fileds];
}

async function getrestaurant(restaurant_id) {
  var conn = await connection.getConnection();

  let [restaurantresults, imageurlfileds] = await conn.query(
    `select * from restaurants where restaurant_id = ?`,restaurant_id);
  conn.release();
  if (restaurantresults.length > 0) {
    return restaurantresults[0];
  } else {
    throw new Error("找不到餐廳");
  }

}





module.exports = {
  findrestaurantID,
  getrestaurant,
  createnewrestaurant,
  findrestaurantID,
};
