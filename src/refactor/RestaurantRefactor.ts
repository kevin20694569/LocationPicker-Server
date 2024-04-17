import MySQLRestaurantsTableService from "../Model/MySQL/MySQLRestaurantsTableService";
import MySQLUsersTableService from "../Model/MySQL/MySQLUsersTableService";
import GoogleMapAPIService from "../Model/GoogleMapAPI/GoogleMapAPIService";
import MongoDBBusiness_TimeService from "../Model/MongoDB/MongoDBBusinessTimeService";
import SocketIOSingletonController from "../controller/SocketIO/SocketIOSingletonController";
import MongoDBPostService from "../Model/MongoDB/MongoDBPostService";
import MongoDB from "../Model/MongoDB/MongoDB";
import Neo4jFriendShipService from "../Model/Neo4j/Neo4jFriendShipService";
import "dotenv/config";
import { UserModel } from "../Model/MongoDB/MongoDBModel";
import MongoDBUserService from "src/Model/MongoDB/MongoDBUserService";
class Refactor {
  sqlDBPassword: string;
  restaurantTableService: MySQLRestaurantsTableService;
  userTableService: MySQLUsersTableService;
  googleMapAPIService = new GoogleMapAPIService();
  mongoDBBusiness_TimeService = new MongoDBBusiness_TimeService();
  socketIOSingletonService = new SocketIOSingletonController();
  mongoDBPostService = new MongoDBPostService();
  neo4jFriendShipService = new Neo4jFriendShipService();
  mongoDBConnection = MongoDB;
  constructor(sqlDBPassword: string) {
    this.sqlDBPassword = sqlDBPassword;
    this.restaurantTableService = new MySQLRestaurantsTableService(sqlDBPassword);
    this.userTableService = new MySQLUsersTableService(sqlDBPassword);
  }
  async standardPlace() {
    try {
      this.mongoDBConnection.connectToMongoDB();
      let results = await this.restaurantTableService.getAllTableRestaurants();
      let place_ids = results.map((place) => {
        return place.id;
      });
      let newInit = 0;
      for (let i = 0; i < place_ids.length; i++) {
        let id = place_ids[i];
        if (id != "ChIJ41wbgbqrQjQR75mxQgbywys") {
          // continue;
        }
        // let restaurant = await googleMapService.searchPlaceByID(id);

        //  await restaurantTable.updateRestaurant(restaurant);
        //  await insertBusinessTime(restaurant);
        await this.updateRestaurantPostsCount(id);
        newInit += 1;
        console.log(`${id}正規完成`);
      }
      console.log(`總共正規${newInit}個Place`);
    } catch (error) {
      console.log(error);
    }
  }

  async standardUser(user_id?: number) {
    try {
      let results;
      if (user_id == null) {
        results = await this.userTableService.getAllUsers();
      } else {
        results = [{ user_id: user_id }];
      }
      let newInit = 0;
      for (let i = 0; i < results.length; i++) {
        let id = results[i].id;
        await this.updateUserPostsCount(id);
        await this.updateUserFriendsCount(id);
        newInit += 1;
        console.log(`${id}正規完成`);
      }
      console.log(`總共正規${newInit}個Place`);
    } catch (error) {
      console.log(error);
    }
  }

  async insertBusinessTime(restaurant) {
    let { place_id, opening_hours } = restaurant;
    await this.mongoDBBusiness_TimeService.insertBusinessTime(place_id, opening_hours);
  }

  async updateRestaurantPostsCount(id) {
    let posts = await this.mongoDBPostService.getRestaurantPostsFromRestaurantID(id, new Date());
    await this.restaurantTableService.updateRestaurantPostsCount(id, posts.length);
  }
  async averagePlaceAverage() {
    try {
      let results = await this.mongoDBPostService.calculateRestaurantAverage();
      let newInit = 0;
      for (const result of results) {
        let { restaurant_id, average_grade } = result;

        await this.restaurantTableService.updateAverageGrade(restaurant_id, average_grade);
        newInit++;
      }
      console.log(`總共計算${newInit}個Place平均分數`);
    } catch (error) {
      console.log(error);
    }
  }

  async updateUserPostsCount(user_id) {
    let posts = await this.mongoDBPostService.getPostsByUserID(user_id, new Date());
    await this.userTableService.setUserPostsCount(user_id, posts.length);
  }

  async updateUserFriendsCount(user_id) {
    let friends = await this.neo4jFriendShipService.searchFriendsByUserID(user_id);
    await this.userTableService.setUserFriendsCount(user_id, friends.length);
  }
}
export default Refactor;

//refactor.standardPlace();
