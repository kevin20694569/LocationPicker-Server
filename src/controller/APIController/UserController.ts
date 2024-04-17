import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";
import "dotenv/config";

class UserController extends ControllerBase {
  async getUserProfile(req: Request, res: Response, next: NextFunction) {
    let user_id = req.params.id;
    let { request_user_id } = req.query;
    request_user_id = request_user_id as string;
    let { date } = req.query;
    let datObject: Date;
    if (date == undefined || date == "" || date == null) {
      datObject = new Date();
    } else {
      datObject = new Date(date as string);
    }
    try {
      let result = await this.mysqlUsersTableService.getUserProfileByID(user_id);
      if (!result) {
        throw new Error("getUserProfile失敗");
      }
      let friendStatus: string;
      if (request_user_id == user_id) {
        friendStatus = "isSelf";
      } else {
        let friendNodes = await this.neo4jFriendShipService.checkUsersAreFriend(request_user_id, [user_id]);
        let friendNode = friendNodes[0];
        if (friendNode) {
          if (friendNode["friendship"] != null) {
            friendStatus = "isFriend";
          } else if (friendNode["receiveRequestUser"] != null) {
            friendStatus = "hasBeenSentRequest";
          } else if (friendNode["requestSender"] != null) {
            friendStatus = "requestNeedRespond";
          }
        } else {
          friendStatus = "notFriend";
        }
      }

      let json = {
        user: result,
        friendStatus: friendStatus,
      };
      res.json(json);
      res.status(200);
    } catch (error) {
      res.status(404);
      console.log(error);
    } finally {
      res.end();
    }
  }
}

export default UserController;
