import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";
import MongoDBPostService from "../../Model/MongoDB/MongoDBPostService";
import MySQLUsersTableService from "../../Model/MySQL/MySQLUsersTableService";
import MongoDBReactionService from "../../Model/MongoDB/MongoDBReactionService";
import Neo4jFriendShipService from "../../Model/Neo4j/Neo4jFriendShipService";
import MySQLRestaurantsTableService from "../../Model/MySQL/MySQLRestaurantsTableService";

class FriendShipController extends ControllerBase {
  protected postMediaFolderString = this.serverIP + "/public/media";

  async acceptFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      let { accept_user_id } = req.body;
      accept_user_id = parseInt(accept_user_id);
      let friend_request_id = req.params.id;
      throw new Error("測試 不得接受好友");
      let results = await this.neo4jFriendShipService.acceptToCreateFriendship(
        parseInt(accept_user_id as string),
        parseInt(friend_request_id as string)
      );
      await this.mysqlUsersTableService.updateUserFriendsCount(parseInt(accept_user_id as string), 1);
      await this.mysqlUsersTableService.updateUserFriendsCount(parseInt(friend_request_id as string), 1);
      res.status(200);
      res.json(results[0]);
    } catch (error) {
      res.status(404).send(error);
      console.log(error);
    } finally {
      res.end();
    }
  }

  async removeFriendShip(req: Request, res: Response, next: NextFunction) {
    try {
      let { request_user_id, to_user_id } = req.body;
      let results = await this.neo4jFriendShipService.deleteFriendShip(request_user_id, to_user_id);

      if (results.length > 0) {
        res.status(200).send("刪除成功");
        await this.mysqlUsersTableService.updateUserFriendsCount(request_user_id, -1);
        await this.mysqlUsersTableService.updateUserFriendsCount(to_user_id, -1);
      } else {
        throw new Error("預期外的錯誤");
      }
    } catch (error) {
      res.status(404).send(error);
      console.log(error);
    } finally {
      res.end();
    }
  }

  async getUserFriends(req: Request, res: Response, next: NextFunction) {
    try {
      let { request_user_id } = req.query;
      let results = await this.neo4jFriendShipService.searchFriendsByUserID(parseFloat(request_user_id as string));
      let ids = results.map((result) => {
        return parseInt(result.friend.user_ID);
      });
      let users = await this.mysqlUsersTableService.getUserByIDs(ids);
      let userMap: object = {};
      users.forEach((user) => {
        userMap[user.user_id] = user;
      });
      results.forEach((result) => {
        result["user"] = userMap[result["friend"]["user_ID"]];
      });
      res.json(results);
    } catch (error) {
      res.status(500);
      console.log(error);
    } finally {
      res.end();
    }
  }
}

export default FriendShipController;
