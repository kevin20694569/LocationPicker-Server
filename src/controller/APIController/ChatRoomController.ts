import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";

import { ResultSummary, error } from "neo4j-driver";
import mongoose, { Mongoose, mongo } from "mongoose";

class ChatRoomController extends ControllerBase {
  async getChatRoomPreviews(req: Request, res: Response, next: NextFunction) {
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

      let lastMessages = await this.mongodbMessageService.getLastMessagesByRequestUserid(request_user_id, dateObject, room_idsToExclude);

      if (lastMessages.length == 0) {
        res.json();
        return;
      }
      let room_ids: string[] = lastMessages.map((message) => {
        return message.room_id;
      });

      let chatRooms = await this.mongodbChatRoomService.getChatRoomsByRoomID(room_ids);
      let userMap = {};
      let roomMap = {};
      chatRooms.forEach((room) => {
        let room_id = room._doc.room_id;
        roomMap[room_id] = room;
        room.user_ids.forEach((user_id: string) => {
          if (!userMap[user_id]) {
            userMap[user_id] = user_id;
          }
        });
      });

      let user_ids: string[] = Object.values(userMap);
      let users = await this.mysqlUsersTableService.getUserByIDs(user_ids);
      users.forEach((user) => {
        if (userMap[user.id]) {
          userMap[user.id] = user;
        }
      });
      lastMessages = lastMessages.map((result, index) => {
        if (result.shared_post_id) {
          result.message = "分享了一則貼文";
        } else if (result.shared_user_id) {
          result.message = "分享了一個帳號";
        } else if (result.shared_restaurant_id) {
          result.message = "分享了一個地點";
        }
        let chatroom = roomMap[result.room_id];
        let user;
        for (const user_id of chatroom.user_ids) {
          if (user_id != request_user_id) {
            user = userMap[user_id];
            break;
          }
        }
        let json = {
          message: result,
          user: user,
          chatroom: chatroom,
        };
        return json;
      });

      lastMessages["responded_room_ids"] = room_ids;
      res.json(lastMessages);
    } catch (error: any) {
      res.status(404).send(error.message);
      console.log(error);
    } finally {
      res.end();
    }
  }

  async getSingleChatRoomPreviewByRoomID(req: Request, res: Response, next: NextFunction) {
    try {
      let room_id = req.params.id;
      let { request_user_id } = req.query;
      if (!request_user_id) {
        throw new Error("沒有輸入request_user_id in query");
      }
      let chatroom = await this.mongodbChatRoomService.getRoomByRoomID(room_id);
      let result = await this.mongodbChatRoomService.getRoomLastMessageByRoomID(room_id);
      if (!result) {
        res.status(404);
        return;
      }
      let anotherUser_id = result.user_ids.filter((user_id: string) => {
        if (user_id == request_user_id) {
          return false;
        }
        return true;
      });
      let user = await this.mysqlUsersTableService.getUserProfileByID(anotherUser_id);
      res.json({
        message: result,
        user: user,
        chatroom: chatroom,
      });
    } catch (error: any) {
      res.status(404).send(error.message);
      console.log(error);
    } finally {
      res.end();
    }
  }

  async getSingleChatRoomPreviewByUserIDs(req: Request, res: Response, next: NextFunction) {
    try {
      let { user_ids } = req.body;
      let { request_user_id } = req.query;

      if (!request_user_id) {
        throw new Error("沒有輸入request_user_id in query");
      }
      let room = await this.mongodbChatRoomService.getRoomByUserEachids(user_ids);
      let room_id = room.room_id;
      let result = await this.mongodbChatRoomService.getRoomLastMessageByRoomID(room_id);
      let anotherUser_id = result.user_ids.filter((user_id: string) => {
        if (user_id == request_user_id) {
          return false;
        }
        return true;
      });
      let user = await this.mysqlUsersTableService.getUserProfileByID(anotherUser_id);
      res.json({
        message: result,
        user: user,
        chatroom: room,
      });
    } catch (error: any) {
      res.status(404).send(error.message);
      console.log(error);
    } finally {
      res.end();
    }
  }

  async getChatRoom(req: Request, res: Response, next: NextFunction) {
    try {
      let { user_ids } = req.body;
      let { request_user_id } = req.query;

      if (!request_user_id) {
        throw new Error("沒有輸入request_user_id in query");
      }
      let room = await this.mongodbChatRoomService.getRoomByUserEachids(user_ids);
      res.json(room);
    } catch {
      console.log(error);
      res.status(404);
    } finally {
      res.end();
    }
  }
}

export default ChatRoomController;
