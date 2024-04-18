import mongoose, { StringExpression, mongo, ProjectionType } from "mongoose";
import { ChatRoomModel, MessageModel, UserModel } from "./MongoDBModel";
import MongoDBMessageService from "./MongoDBMessageService";
import MySQLUsersTableService from "../MySQL/MySQLUsersTableService";

import MongoDBUserService from "./MongoDBUserService";
import Neo4jFriendShipService from "../Neo4j/Neo4jFriendShipService";
import { ResultSummary } from "neo4j-driver";

class MongoDBChatRoomService {
  protected chatRoomModel: mongoose.Model<any> = ChatRoomModel;
  protected MessageModel: mongoose.Model<any> = MessageModel;
  protected UserModel: mongoose.Model<any> = UserModel;
  protected neo4jFriendShipService: Neo4jFriendShipService = new Neo4jFriendShipService();
  protected messageService = new MongoDBMessageService();
  protected userTableSerivice = new MySQLUsersTableService();
  protected mongoDBService = new MongoDBUserService();

  async createRoom(user_ids: string[]) {
    try {
      let chatroomModel = {
        user_ids: user_ids,
      };

      let result = await this.chatRoomModel.create(chatroomModel);
      result._doc["room_id"] = result._id;
      await this.mongoDBService.insertRoomIdToUser(user_ids, result._id);
      return result;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  async createManyRoom(models) {
    try {
      let newRooms = await this.chatRoomModel.insertMany(models);

      return newRooms;
    } catch (error) {
      throw error;
    }
  }

  async getRoomsBySenderidAndRecieveids(sender_id: string, receive_ids: string[]) {
    try {
      receive_ids = receive_ids.filter((id) => {
        if (id == sender_id) {
          return false;
        }
        return true;
      });
      const pipeline = [
        // 第一阶段：筛选出符合条件的文档
        {
          $match: {
            user_ids: {
              $in: [sender_id],
            },
          },
        },
        // 第二阶段：计算 recieve_idsArray 中与 user_ids 的交集，如果有交集则返回 1，否则返回 0
        {
          $addFields: {
            recieve_match: {
              $cond: {
                if: { $gt: [{ $size: { $setIntersection: [receive_ids, "$user_ids"] } }, 0] },
                then: 1,
                else: 0,
              },
            },
            intersection: { $setIntersection: [receive_ids, "$user_ids"] },
          },
        },
        {
          $unwind: "$intersection", // 展开交集数组
        },

        // 第三阶段：筛选出 recieve_match 为 1 的文档
        {
          $match: {
            recieve_match: 1,
          },
        },
      ];

      let results = await this.chatRoomModel.aggregate(pipeline);
      if (results.length == receive_ids.length) {
        return results;
      }
      let intersectionArray = results.map((result) => {
        return result.intersection;
      });

      const needCreatedChatRoomUseridArray: string[] = receive_ids.filter((id) => !intersectionArray.includes(id));
      let models = needCreatedChatRoomUseridArray.map((userid) => {
        let user_ids = [sender_id, userid];
        let chatroomModel = {
          user_ids: user_ids,
        };
        return chatroomModel;
      });
      let newChatRooms = await this.createManyRoom(models);
      for (const chatRoom of newChatRooms) {
        await this.mongoDBService.insertRoomIdToUser(chatRoom.room_users, chatRoom._id);
      }
      newChatRooms.forEach((room) => {
        results.push(room);
      });

      return results;
    } catch (error) {
      throw error;
    }
  }

  async getRoomLastMessageByRoomID(room_id: string) {
    try {
      let obID = new mongoose.Types.ObjectId(room_id);
      let result = await this.chatRoomModel.findById(obID);
      if (!result) {
        return null;
      }
      let messages = await this.messageService.getRoomMessage(room_id, new Date(), 1);
      if (messages.length < 1) {
        return {
          room_id: result._id,
          user_ids: result.user_ids,
          sender_id: null,
          message: null,
        };
      }
      let message = messages[0];

      let messageText = message.message;
      if (message.shared_post_id) {
        messageText = "分享一則貼文";
      }
      let json = {
        room_id: result.room_id,
        user_ids: result.user_ids,
        sender_id: message.sender_id,
        message: messageText,
        shared_post_id: message.shared_post_id,
        isread: message.isread,
        created_time: message.created_time,
      };
      return json;
    } catch (error) {
      throw error;
    }
  }

  async getRoomByUserEachids(user_ids: string[]) {
    try {
      let room = await this.chatRoomModel.findOne({ user_ids: { $all: user_ids } }, { _id: 1, room_id: "$_id", user_ids: 1 });
      if (room) {
        return room;
      }
      let results = await this.neo4jFriendShipService.checkUsersAreFriend(user_ids[0], [user_ids[1]]);
      if (results.length < 1) {
        throw new Error("彼此無好友關係");
      }
      room = await this.createRoom(user_ids);
      return room;
    } catch (error) {
      throw error;
    }
  }

  async getRoomByRoomID(room_id: string) {
    let room = await this.chatRoomModel.findOne({ _id: room_id }, { _id: 0, room_id: "$_id", user_ids: 1 });
    return room;
  }

  async getChatRoomsByRoomID(room_ids: string[]) {
    let rooms = await this.chatRoomModel.find({ _id: { $in: room_ids } }, { _id: 0, room_id: "$_id", user_ids: 1 });
    return rooms;
  }
}

export default MongoDBChatRoomService;
