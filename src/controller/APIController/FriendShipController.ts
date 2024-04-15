import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";
import MongoDBPostService from "../../Model/MongoDB/MongoDBPostService";
import MySQLUsersTableService from "../../Model/MySQL/MySQLUsersTableService";
import MongoDBReactionService from "../../Model/MongoDB/MongoDBReactionService";
import Neo4jFriendShipService from "../../Model/Neo4j/Neo4jFriendShipService";
import MySQLRestaurantsTableService from "../../Model/MySQL/MySQLRestaurantsTableService";
import { Result } from "neo4j-driver";

class FriendShipController extends ControllerBase {
  protected postMediaFolderString = this.serverIP + "/public/media";

  async acceptFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      let { accept_user_id } = req.body;
      accept_user_id = parseInt(accept_user_id);
      let friend_request_id = req.params.id;
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

  async acceptFriendRequestByEachUserID(req: Request, res: Response, next: NextFunction) {
    try {
      let { accept_user_id, request_user_id } = req.body;
      accept_user_id = parseInt(accept_user_id);
      request_user_id = parseInt(request_user_id);
      let results = await this.neo4jFriendShipService.acceptToCreateFriendshipByEachUserID(accept_user_id, request_user_id);
      await this.mysqlUsersTableService.updateUserFriendsCount(accept_user_id, 1);
      await this.mysqlUsersTableService.updateUserFriendsCount(request_user_id, 1);
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
      let target_user_id = parseInt(req.params.id);
      let { request_user_id } = req.query;
      let request_user_id_num = parseInt(request_user_id as string);

      let results = await this.neo4jFriendShipService.searchFriendsByUserID(target_user_id, request_user_id_num);
      let ids = results.map((result) => {
        return parseInt(result.friend.user_ID);
      });
      let friendNodes = await this.neo4jFriendShipService.checkUsersAreFriend(request_user_id_num, ids);
      let users = await this.mysqlUsersTableService.getUserByIDs(ids);
      let userMap: object = {};
      let friendsMap: Object = {};
      users.forEach((user) => {
        userMap[user.user_id] = user;
      });
      for (const friendNode of friendNodes) {
        if (friendNode["friendship"]) {
          friendsMap[friendNode["user"]["user_ID"]] = "isFriend";
          continue;
        }
        if (friendNode["receiveRequestUser"]) {
          friendsMap[friendNode["user"]["user_ID"]] = "hasBeenSentRequest";
          continue;
        }
        if (friendNode["requestSender"]) {
          friendsMap[friendNode["user"]["user_ID"]] = "requestNeedRespond";
          continue;
        }
        friendsMap[friendNode["user"]["user_ID"]] = "notFriend";
      }
      const highPriorityResults = [];
      const mediumPriorityResults = [];
      const lowPriorityResults = [];
      const lowestPriorityResults = [];
      for (const result of results) {
        let user_id = result["friend"]["user_ID"];
        result["user"] = userMap[user_id];
        result["friendStatus"] = "notFriend";
        if (friendsMap[user_id]) {
          result["friendStatus"] = friendsMap[user_id];
        } else {
          lowestPriorityResults.push(result);
          continue;
        }
        let statusString = friendsMap[user_id];
        if (statusString === "requestNeedRespond") {
          highPriorityResults.push(result);
        } else if (statusString === "hasBeenSentRequest") {
          mediumPriorityResults.push(result);
        } else if (statusString === "isFriend") {
          lowPriorityResults.push(result);
        }
      }
      const sortedResults = [];
      sortedResults.push(...highPriorityResults);
      sortedResults.push(...mediumPriorityResults);
      sortedResults.push(...lowPriorityResults);
      sortedResults.push(...lowestPriorityResults);

      res.json(sortedResults);
    } catch (error) {
      res.status(500);
      console.log(error);
    } finally {
      res.end();
    }
  }
}

export default FriendShipController;
