import MySQLTableControllerBase from "./MySQLTableServiceBase";
import GoogleMapAPIService from "../GoogleMapAPI/GoogleMapAPIService";
import MongoDBBusiness_TimeService from "../MongoDB/MongoDBBusinessTimeService";

class MySQLRestaurantsTableService extends MySQLTableControllerBase {
  protected restaurantImageIP = this.serverIP + "/restaurantimage/";
  protected selectString = `CONCAT("${this.restaurantImageIP}", id, ".jpg") AS restaurant_imageurl`;
  protected googleMapAPIService = new GoogleMapAPIService();
  protected business_TimeService = new MongoDBBusiness_TimeService();
  constructor(password?: string) {
    super(password);
  }

  async findRestaurantID(restaurant_ID: string, firstGrade?: number) {
    try {
      await this.getConnection();
      let query = `select * from restaurants where id = ?;`;
      let params = [restaurant_ID];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(query, params);
      let restaurantDetail;
      if (results.length < 1) {
        let restaurant = await this.restaurantsearchfromgoogleByID(restaurant_ID);
        let { place_id, lat, lng, photos, opening_hours } = restaurant;
        if (place_id == null) {
          throw new Error("找不到地點");
        }
        if (opening_hours == undefined) {
          opening_hours = null;
        }
        let { photo_reference } = photos[0];
        await this.googleMapAPIService.downloadPhoto(photo_reference, place_id);
        let [results, fields] = await this.createnewrestaurant(restaurant, firstGrade);

        await this.business_TimeService.insertBusinessTime(place_id, opening_hours);
        restaurantDetail = {
          id: place_id,
          latitude: lat,
          longitude: lng,
        };
      } else {
        restaurantDetail = results[0];
      }
      let business_time = await this.business_TimeService.getPlaceBusinessTimes(restaurant_ID);
      let json = {
        ...restaurantDetail,
      };
      if (business_time) {
        json = {
          ...json,
          ...business_time["_doc"],
        };
      }
      return json;
    } catch (error) {
      await this.deleteRestaurant(restaurant_ID);
      throw error;
    } finally {
      this.release();
    }
  }

  async updateRestaurantAverage_GradeWithInputGrade(restaurant_id: String, input_grade: Number) {
    await this.getConnection();
    let query = `UPDATE restaurants
    SET average_grade = (average_grade * posts_count + ?) / (posts_count + 1)
    WHERE id = ?;`;
    let params = [input_grade, restaurant_id];
    let results: any[];
    let fields: any;
    [results, fields] = await this.pool.query(query, params);
  }

  async updateRestaurantPostsCountWithInput(restaurant_id: String, increaseCount: Number) {
    let query = `update restaurants set posts_count = posts_count + ? where id = ?`;
    let params = [increaseCount, restaurant_id];
    let results: any[];
    let fields: any;
    [results, fields] = await this.pool.query(query, params);
  }

  async updateRestaurantPostsCount(restaurant_id: String, posts_count: Number) {
    let query = `update restaurants set posts_count = ? where id = ?`;
    let params = [posts_count, restaurant_id];
    let results: any[];
    let fields: any;
    [results, fields] = await this.pool.query(query, params);
    if (results.length < 1) {
      throw new Error("updateRestaurantPostsCount錯誤");
    }
  }

  async getrestaurantDistanceAndDetail(restaurant_id: String, lat?: Number, lng?: Number) {
    try {
      await this.getConnection();

      let query = `select *, ST_DISTANCE(POINT(restaurants.longitude, restaurants.latitude), POINT(?, ?)) AS distance, ${this.selectString}  from restaurants where restaurants.id = ?;`;
      var params = [lng ?? 0, lat ?? 0, restaurant_id];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(query, params);
      let restaurant = results[0];
      this.translateBool(restaurant);
      if (results.length > 0) {
        return results[0];
      } else {
        throw new Error("找不到餐廳");
      }
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async updateRestaurant(restaurant) {
    try {
      let { place_id, name, formatted_address, lat, lng, takeout, reservable, price_level, website, formatted_phone_number } = restaurant;
      await this.getConnection();
      let query = `update restaurants set name = ?, address = ?, latitude = ?, longitude = ?, takeout = ?, reservable = ?, price_level = ?, website = ?, formatted_phone_number = ? where id = ? ;`;
      let params = [name, formatted_address, lat, lng, takeout, reservable, price_level, website, formatted_phone_number, place_id];
      let results: any[];
      let fields: any;

      [results, fields] = await this.pool.query(query, params);
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async createnewrestaurant(restaurant, grade: number) {
    let { place_id, name, formatted_address, lat, lng, takeout, reservable, price_level, website, formatted_phone_number } = restaurant;
    try {
      await this.getConnection();
      let query = `insert into restaurants (id, name, address, latitude, longitude, average_grade, posts_count, takeout, reservable, price_level, website, formatted_phone_number) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
      let results: any[];
      let fields: any;
      let params = [place_id, name, formatted_address, lat, lng, grade, 1, takeout, reservable, price_level, website, formatted_phone_number];
      [results, fields] = await this.pool.query(query, params);
      return [results, fields];
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async deleteRestaurant(place_id: string) {
    try {
      await this.getConnection();
      let query = `DELETE FROM restaurants WHERE id = ?;`;
      let params = [place_id];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(query, params);
      return [results, fields];
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async getRestaurantsDetail(restaurant_Ids: string[]) {
    try {
      if (restaurant_Ids.length < 1) {
        return [];
      }
      await this.getConnection();
      let query = `Select *, ${this.selectString} from restaurants Where id in (?)`;
      let params = [restaurant_Ids];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(query, params);
      results.forEach((restaurant) => {
        this.translateBool(restaurant);
      });
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async getnearlocactionRestaurants(latitude: number, longitude: number, offset: number, lastrestaurantid: string, limit: number) {
    try {
      await this.getConnection();
      let query = `select *,
      ST_DISTANCE(POINT(restaurants.longitude, restaurants.latitude), POINT(?, ?)) AS distance,
      ${this.selectString}
      from restaurants 
      WHERE restaurants.restaurant_id IS NOT NULL AND ST_DISTANCE(POINT(restaurants.longitude, restaurants.latitude)
      POINT(?, ?))  > ?
      AND restaurants.id != ?
      ORDER BY distance
      limit ?`;

      let params: any[];
      if (offset) {
        params = [longitude, latitude, longitude, latitude, offset, lastrestaurantid, limit];
      } else {
        params = [longitude, latitude, longitude, latitude, 0, "", limit];
      }
      let results: any[];
      let fields: any;

      [results, fields] = await this.pool.query(query, params);

      for (const value of results) {
        this.translateBool(value);
      }
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }
  async getAllTableRestaurants() {
    try {
      await this.getConnection();
      let query = `select * from restaurants;`;
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(query);
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async updateAverageGrade(restaurant_id: String, averge_grade: Number) {
    try {
      await this.getConnection();
      let query = `update restaurants set average_grade = ? where id = ?;`;
      let params = [averge_grade, restaurant_id];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(query, params);
      return results;
    } catch (error) {
      throw error;
    }
  }
  async restaurantsearchfromgoogleByID(location_ID: String) {
    let result = await this.googleMapAPIService.searchPlaceByID(location_ID);
    return result;
  }

  translateBool(restaurant) {
    if (restaurant.reservable) {
      restaurant.reservable = restaurant.reservable == 1 ? true : false;
    }
    if (restaurant.takeout) {
      restaurant.takeout = restaurant.takeout == 1 ? true : false;
    }
  }
}

export default MySQLRestaurantsTableService;
