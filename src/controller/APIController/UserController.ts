import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";
import "dotenv/config";

class UserController extends ControllerBase {
  async getUserProfile(req: Request, res: Response, next: NextFunction) {
    let id = req.params.id;
    let user_id = parseInt(id);
    let { request_user_id } = req.query;

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
      let isFriend = await this.neo4jFriendShipService.checkIsFriend(parseInt(request_user_id as string), parseInt(id));
      let json = {
        user: result,
        isFriend: isFriend,
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
