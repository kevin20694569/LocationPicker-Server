import mongoose, { StringExpression, mongo, ProjectionType } from "mongoose";
import { ChatRoomModel, MessageModel, UserModel } from "./MongoDBModel";
import MongoDBMessageService from "./MongoDBMessageService";
import MySQLUsersTableService from "../MySQL/MySQLUsersTableService";

import MongoDBUserService from "./MongoDBUserService";
import { ResultSummary, error } from "neo4j-driver";

class MongoDBChatRoomService {
  protected chatRoomModel: mongoose.Model<any> = ChatRoomModel;
  protected MessageModel: mongoose.Model<any> = MessageModel;
  protected UserModel: mongoose.Model<any> = UserModel;
  protected messageService = new MongoDBMessageService();
  protected userTableSerivice = new MySQLUsersTableService();
  protected mongoDBService = new MongoDBUserService();

  async createRoom(room_id: String, user_ids: Number[]) {
    try {
      const filter = { room_id: room_id };
      const options = { upsert: true };
      let chatroomModel = {
        room_id: room_id,
        room_users: user_ids,
      };
      let result = await this.chatRoomModel.findOneAndUpdate(filter, chatroomModel, options);
      await this.mongoDBService.insertRoomIdToUser(user_ids, room_id);
      return result;
    } catch (error) {
      console.log(error);
      throw new Error("創建聊天室失敗");
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

  async getRoomsBySenderidAndRecieveids(sender_id: number, receive_ids: number[]) {
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
            room_users: {
              $in: [sender_id],
            },
          },
        },
        // 第二阶段：计算 recieve_idsArray 中与 user_ids 的交集，如果有交集则返回 1，否则返回 0
        {
          $addFields: {
            recieve_match: {
              $cond: {
                if: { $gt: [{ $size: { $setIntersection: [receive_ids, "$room_users"] } }, 0] },
                then: 1,
                else: 0,
              },
            },
            intersection: { $setIntersection: [receive_ids, "$room_users"] },
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
      const needCreatedChatRoomUseridArray: number[] = receive_ids.filter((id) => !intersectionArray.includes(id));
      let models = needCreatedChatRoomUseridArray.map((userid) => {
        let user_ids = [sender_id, userid];
        let room_id = this.mergeEachidToRoomID(user_ids);

        let chatroomModel = {
          room_id: room_id,
          room_users: user_ids,
        };
        return chatroomModel;
      });
      for (const model of models) {
        await this.mongoDBService.insertRoomIdToUser(model.room_users, model.room_id);
      }
      let newChatRooms = await this.createManyRoom(models);
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
      let result = await this.chatRoomModel.findOne({
        room_id: room_id,
      });

      if (!result) {
        throw new Error("沒有這個ChatRoom");
      }
      let messages = await this.messageService.getRoomMessage(room_id, "", 1);
      if (messages.length < 1) {
        return {
          room_id: result.room_id,
          room_users: result.room_users,
          sender_id: null,
          message: null,
        };
      }
      let message = messages[0];

      let messageText = message.message;
      if (message.shared_Post_id) {
        messageText = "分享一則貼文";
      }
      let json = {
        room_id: result.room_id,
        room_users: result.room_users,
        sender_id: message.sender_id,
        message: messageText,
        shared_Post_id: message.shared_Post_id,
        isRead: message.isRead,
        created_time: message.created_time,
      };
      return json;
    } catch (error) {
      throw error;
    }
  }

  async getRoomByUserEachids(ids: number[]) {
    try {
      let room = await this.chatRoomModel.findOne({ room_users: { $all: ids } }, { room_id: 1, room_users: 1 });
      if (room) {
        return room;
      }
      let room_id = this.mergeEachidToRoomID(ids);
      room = await this.createRoom(room_id, ids);
      return room;
    } catch (error) {
      throw error;
    }
  }

  mergeEachidToRoomID(ids: number[]) {
    if (ids.length == 1 || ids.length > 2) {
      throw new Error("聊天室ids merge失敗");
    }
    ids = ids.sort((a, b) => a - b);
    let room_id = ids.join("_");
    return room_id;
  }

  async getPreviewsByUserId(user_id: number, dateString: String, room_idToExclude: String[]) {
    try {
      var user = await this.UserModel.findOne({ user_id: user_id });
      var chatRoomIds = user.chatRoomIds;
      let date: Date;
      if (!dateString) {
        date = new Date();
      } else {
        date = new Date(date);
      }

      var results = await this.MessageModel.aggregate([
        {
          $match: {
            room_id: { $in: chatRoomIds, $nin: room_idToExclude },
            created_time: { $lt: date },
          },
        },
        {
          $group: {
            _id: "$room_id",
            messages: {
              $push: {
                message: "$message",
                created_time: "$created_time",
                shared_Post_id: "$shared_Post_id",
                sender_id: "$sender_id",
                isRead: "$isRead",
              },
            },
            lastMessageTime: { $max: "$created_time" },
            isRead: { $max: "$isRead" },
          },
        },
        {
          $sort: {
            lastMessageTime: -1,
            isRead: 1,
            _id: -1,
          },
        },
        { $limit: 15 },
        {
          $project: {
            _id: 0,
            room_id: "$_id",
            lastMessage: { $arrayElemAt: ["$messages", -1] }, // 获取 messages 数组中的最后一个元素作为 lastMessage
            message: "$lastMessage",
          },
        },
        {
          $addFields: {
            sender_id: "$lastMessage.sender_id", // 将 sender_id 的值赋给新的字段 senderId
            created_time: "$lastMessage.created_time",
            shared_Post_id: "$lastMessage.shared_Post_id",
            message: "$lastMessage.message",
            isRead: "$lastMessage.isRead",
          },
        },
        {
          $project: {
            room_id: 1,
            sender_id: 1,
            created_time: 1,
            message: 1,
            shared_Post_id: 1,
            isRead: 1,
          },
        },
      ]);
      return results;
    } catch (error) {
      console.log(error);
      throw new Error("查不到這個Preview");
    }
  }
}

export default MongoDBChatRoomService;
