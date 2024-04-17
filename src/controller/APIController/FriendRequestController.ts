import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";

class FriendRequestController extends ControllerBase {
  protected postMediaFolderString = this.serverIP + "/public/media";

  async getUserFriendRecieveRequests(req, res: Response, next: NextFunction) {
    try {
      let { request_user_id, date } = req.query;
      request_user_id = request_user_id as string;
      let results = await this.neo4jFriendShipService.searchFriendRecieveRequestsByUserID(request_user_id, date);
      let requestMap = {};
      let ids = results.map((result) => {
        requestMap[result["from_user"]["user_id"]] = result.request;
        return result["from_user"]["user_id"];
      });
      let usersMap = {};
      let users = await this.mysqlUsersTableService.getUserByIDs(ids);
      users.map((user) => {
        usersMap[user.id] = user;
      });
      let json = results.map((result) => {
        return {
          request: result.request,
          user: usersMap[result.from_user.user_id],
        };
      });
      res.json(json);
    } catch (error) {
      res.status(404).send(error.message);
      console.log(error.message);
    } finally {
      res.end();
    }
  }

  async sendFriendRequst(req: Request, res: Response, next: NextFunction) {
    try {
      let { request_user_id, to_user_id } = req.body;
      let results = await this.neo4jFriendShipService.sendFriendRequest(request_user_id, to_user_id);
      res.json(results[0]);
    } catch (error) {
      res.status(404).send(error.message);
      console.log(error.message);
    } finally {
      res.end();
    }
  }

  async deleteFriendRequst(req: Request, res: Response, next: NextFunction) {
    try {
      let { request_user_id, to_user_id } = req.body;
      await this.neo4jFriendShipService.deleteFriendRequest(request_user_id, to_user_id);
      res.status(200).send("刪除成功");
    } catch (error) {
      res.status(404).send(error.message);
      console.log(error.message);
    } finally {
      res.end();
    }
  }

  async getUserFriendSentRequest(req: Request, res: Response, next: NextFunction) {
    try {
      let { request_user_id, date } = req.query;
      request_user_id = request_user_id as string;
      let results = await this.neo4jFriendShipService.searchFriendSentRequestsByUserID(request_user_id, date as string);
      let requestMap = {};
      let ids = results.map((result) => {
        requestMap[result["to_user"]["user_id"]] = result.request;
        return result["to_user"]["user_id"];
      });
      let usersMap = {};
      let users = await this.mysqlUsersTableService.getUserByIDs(ids);
      users.map((user) => {
        usersMap[user.id] = user;
      });
      let json = results.map((result) => {
        return {
          request: result.request,
          user: usersMap[result.to_user.user_id],
        };
      });
      res.json(json);
    } catch (error) {
      res.status(404).send(error.message);
      console.log(error.message);
    } finally {
      res.end();
    }
  }
}

export default FriendRequestController;
