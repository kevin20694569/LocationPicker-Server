import "dotenv/config";
import Neo4jFriendShipService from "../Model/Neo4j/Neo4jFriendShipService";

import MySQLUsersTableService from "../Model/MySQL/MySQLUsersTableService";
import MySQLRestaurantsTableService from "../Model/MySQL/MySQLRestaurantsTableService";

import MongoDBPostService from "../Model/MongoDB/MongoDBPostService";
import MongoDBReactionService from "../Model/MongoDB/MongoDBReactionService";
import MongoDBBusiness_TimeService from "../Model/MongoDB/MongoDBBusinessTimeService";
import MongoDBChatRoomService from "../Model/MongoDB/MongoDBChatRoomService";
import MongoDBMessageService from "../Model/MongoDB/MongoDBMessageService";
import MongoDBUserService from "../Model/MongoDB/MongoDBUserService";
import UploadMediaController from "./ResourceController/UploadMediaController";

abstract class ControllerBase {
  protected mysqlUsersTableService: MySQLUsersTableService = new MySQLUsersTableService();
  protected mysqlRestaurantsTableService: MySQLRestaurantsTableService = new MySQLRestaurantsTableService();

  protected mongodbPostService: MongoDBPostService = new MongoDBPostService();
  protected mongodbUserService: MongoDBUserService = new MongoDBUserService();
  protected mongodbReactionService: MongoDBReactionService = new MongoDBReactionService();

  protected mongodbBusiness_TimeService: MongoDBBusiness_TimeService = new MongoDBBusiness_TimeService();
  protected mongodbChatRoomService: MongoDBChatRoomService = new MongoDBChatRoomService();
  protected mongodbMessageService: MongoDBMessageService = new MongoDBMessageService();
  protected neo4jFriendShipService: Neo4jFriendShipService = new Neo4jFriendShipService();

  protected uploadMediaController: UploadMediaController = new UploadMediaController();

  protected serverIP?: string = process.env.serverip;
}

export default ControllerBase;
