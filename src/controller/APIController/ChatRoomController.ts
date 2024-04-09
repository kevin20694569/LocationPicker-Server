import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";

import { ResultSummary, error } from "neo4j-driver";

class ChatRoomController extends ControllerBase {
  async getChatRoomsPreviews(req: Request, res: Response, next: NextFunction) {
    try {
      let request_user_id = req.params.id;
      let { room_idsToExclude } = req.body;
      let { date } = req.query;
      if (!room_idsToExclude) {
        room_idsToExclude = [];
      }
      let dateObject: Date = new Date();
      if (date) {
        dateObject = new Date(date as string);
      }
      let results = await this.mongodbChatRoomService.getPreviewsByUserId(parseInt(request_user_id), dateObject, room_idsToExclude);
      if (results.length == 0) {
        res.json();
        return;
      }
      let room_ids: string[] = [];
      let user_ids = results.map((result) => {
        room_ids.push(result.room_id);
        let array = result.room_id.split("_");
        if (parseInt(array[0]) == parseInt(request_user_id)) {
          result["room_user_id"] = parseInt(array[1]);
          return parseInt(array[1]);
        } else {
          result["room_user_id"] = parseInt(array[0]);
          return parseInt(array[0]);
        }
      });
      let users = await this.mysqlUsersTableService.getUserByIDs(user_ids);
      let usersMap: { [key: string]: any } = {};
      users.forEach((user) => {
        usersMap[user.user_id] = user;
      });
      results = results.map((result, index) => {
        if (result.shared_Post_id) {
          result.message = "分享了一則貼文";
        } else if (result.shared_User_id) {
          result.message = "分享了一個帳號";
        } else if (result.shared_Restaurant_id) {
          result.message = "分享了一個地點";
        }

        let json = {
          message: result,
          user: usersMap[result["room_user_id"]],
        };
        return json;
      });
      results["responded_room_ids"] = room_ids;
      res.json(results);
    } catch (error: any) {
      res.status(404).send(error.message);
      console.log(error);
    } finally {
      res.end();
    }
  }

  async getSingleChatRoomPreview(req: Request, res: Response, next: NextFunction) {
    try {
      let room_id = req.params.id;
      let { request_user_id } = req.query;
      if (!request_user_id) {
        throw new Error("沒有輸入request_user_id in query");
      }

      let result = await this.mongodbChatRoomService.getRoomLastMessageByRoomID(room_id);
      let anotherUser_id = result.room_users.filter((id) => {
        if (id == request_user_id) {
          return false;
        }
        return true;
      });
      let user = await this.mysqlUsersTableService.getUserProfileByID(anotherUser_id);
      res.json({
        message: result,
        user: user,
      });
    } catch (error: any) {
      res.status(404).send(error.message);
      console.log(error);
    } finally {
      res.end();
    }
  }
}

export default ChatRoomController;
