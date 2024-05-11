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
      accept_user_id = accept_user_id as string;
      let friend_request_id = req.params.id;
      friend_request_id = friend_request_id as string;
      let results = await this.neo4jFriendShipService.acceptToCreateFriendship(accept_user_id, friend_request_id);
      await this.mysqlUsersTableService.updateUserFriendsCount(accept_user_id, 1);
      await this.mysqlUsersTableService.updateUserFriendsCount(friend_request_id, 1);
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
      let target_user_id = req.params.id;
      let { request_user_id, date } = req.query;

      let dateObject: Date = new Date();
      if (date) {
        date = date as string;
        dateObject = new Date(date);
      }
      request_user_id = request_user_id as string;
      let results = await this.neo4jFriendShipService.searchFriendsByUserID(target_user_id, dateObject, [request_user_id]);
      let ids = results.map((result) => {
        return result.friend.user_id;
      });
      if (ids.length == 0) {
        ids.push(request_user_id);
      }
      let friendNodes = await this.neo4jFriendShipService.checkUsersAreFriend(request_user_id, ids);
      let users = await this.mysqlUsersTableService.getUserByIDs(ids);
      let userMap: object = {};
      let friendsMap: Object = {};
      users.forEach((user) => {
        userMap[user.id] = user;
      });
      for (const friendNode of friendNodes) {
        if (friendNode["friendship"]) {
          friendsMap[friendNode["user"]["user_id"]] = "isFriend";

          continue;
        }
        if (friendNode["receiveRequestUser"]) {
          friendsMap[friendNode["user"]["user_id"]] = "hasBeenSentRequest";
          continue;
        }
        if (friendNode["requestSender"]) {
          friendsMap[friendNode["user"]["user_id"]] = "requestNeedRespond";
          continue;
        }
        friendsMap[friendNode["user"]["user_id"]] = "notFriend";
      }
      const highPriorityResults = [];
      const mediumPriorityResults = [];
      const lowPriorityResults = [];
      const lowestPriorityResults = [];
      for (const result of results) {
        let user_id = result["friend"]["user_id"];
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
      /*if (sortedResults.length == 0) {
        userMap[request_user_id] = {
          user: userMap[request_user_id],
          friendStatus: "isSelf",
        };
        sortedResults.push(userMap[request_user_id]);
      }*/
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
