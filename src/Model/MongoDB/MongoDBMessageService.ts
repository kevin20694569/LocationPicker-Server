import mongoose from "mongoose";
import { MessageModel, MessageType, UserModel } from "./MongoDBModel";

class MongoDBMessageService {
  protected messageModel: mongoose.Model<any> = MessageModel;
  protected userModel: mongoose.Model<any> = UserModel;
  async saveMessageByRoomID(type: MessageType, room_id: string, sender_id: string, message?: string) {
    let created_time = new Date();
    try {
      let messageModel = {
        type: type,
        room_id: room_id,
        sender_id: sender_id,
        message: message,
        created_time: created_time,
      };
      let result = await this.messageModel.create(messageModel);

      return result;
    } catch (error) {
      console.log(error);
      throw new Error("保存訊息失敗");
    }
  }

  async insertManySameMessage(
    type: MessageType,
    sender_id: string,
    room_ids: string[],
    message?: string,
    shared_post_id?: string,
    shared_user_id?: string,
    shared_restaurant_id?: string
  ) {
    try {
      let created_time = new Date();
      let insertData = [];
      room_ids.forEach((room_ID) => {
        let messageModel = {
          type: type,
          room_id: room_ID,
          sender_id: sender_id,
          created_time: created_time,
        };
        let validMessage = false;
        if (message) {
          messageModel["message"] = message;
          validMessage = true;
        }
        if (shared_post_id) {
          messageModel["shared_post_id"] = shared_post_id;
          validMessage = true;
        }
        if (shared_user_id) {
          messageModel["shared_user_id"] = shared_user_id;
          validMessage = true;
        }
        if (shared_restaurant_id) {
          messageModel["shared_restaurant_id"] = shared_restaurant_id;
          validMessage = true;
        }
        if (!validMessage) {
          throw new Error("無效的訊息");
        }
        insertData.push(messageModel);
      });
      let results = await this.messageModel.insertMany(insertData);
      return results;
    } catch (error) {
      throw error;
    }
  }

  async getRoomMessage(room_id: string, date: Date, limit: number) {
    try {
      let results = await this.messageModel
        .find({
          room_id: room_id,
          created_time: { $lt: date },
        })
        .sort({ created_time: -1 })
        .limit(limit)
        .select({
          type: 1,
          room_id: 1,
          sender_id: 1,
          message: 1,
          isread: 1,
          shared_post_id: 1,
          shared_user_id: 1,
          shared_restaurant_id: 1,
          created_time: 1,
        });

      return results;
    } catch (error) {
      throw new Error("獲取roomid訊息失敗");
    }
  }

  async markMessagesAsRead(room_id: string) {
    try {
      const updateResult = await this.messageModel.updateMany({ room_id: room_id, isread: false }, { $set: { isread: true } });
      return updateResult;
    } catch (error) {
      console.log(error);
      throw new Error("獲取roomid訊息失敗");
    }
  }

  async getChatRoomPreviewMessagesByRequestUserid(user_id: string, date: Date, room_idToExclude: String[]) {
    try {
      var user = await this.userModel.findOne({ user_id: user_id });
      var chatroom_ids = user.chatroom_ids;
      var results = await this.messageModel.aggregate([
        {
          $match: {
            room_id: { $in: chatroom_ids, $nin: room_idToExclude },
          },
        },
        {
          $sort: {
            created_time: -1,
          },
        },
        {
          $group: {
            _id: "$room_id",
            lastMessageTime: { $first: "$created_time" }, // 最后一条消息的时间
            room_id: { $first: "$room_id" }, // 房间ID
            messages: { $push: "$$ROOT" }, // 将所有消息保存到 messages 数组中
          },
        },
        {
          $sort: {
            lastMessageTime: -1,
          },
        },
        {
          $limit: 15,
        },
        {
          $project: {
            _id: 0,
            room_id: 1,
            messages: {
              $slice: ["$messages", 50], // 取每个房间的最后 40 条消息
            },
          },
        },
      ]);
      return results;
    } catch (error) {
      throw error;
    }
  }

  async getChatRoomLastMessagesByRoomID(room_id: string) {
    try {
      var messages = await this.messageModel.aggregate([
        {
          $match: {
            room_id: room_id,
          },
        },
        {
          $sort: {
            created_time: -1,
          },
        },
        {
          $limit: 40,
        },
        {
          $project: {
            _id: 0,
            room_id: 1,
            type: "$type",
            message: "$message",
            created_time: "$created_time",
            shared_post_id: "$shared_post_id",
            shared_user_id: "$shared_user_id",
            shared_restaurant_id: "$shared_restaurant_id",
            sender_id: "$sender_id",
            isread: "$isread",
          },
        },
      ]);
      return messages;
    } catch (error) {
      throw error;
    }
  }

  async getLastMessagesByRequestUserid(user_id: string, date: Date, room_idToExclude: String[]) {
    try {
      var user = await this.userModel.findOne({ user_id: user_id });
      var chatroom_ids = user.chatroom_ids;
      var results = await this.messageModel.aggregate([
        {
          $match: {
            room_id: { $in: chatroom_ids, $nin: room_idToExclude },
          },
        },
        {
          $group: {
            _id: "$room_id",
            messages: {
              $push: {
                message: "$message",
                created_time: "$created_time",
                shared_post_id: "$shared_post_id",
                shared_user_id: "$shared_user_id",
                shared_restaurant_id: "$shared_restaurant_id",
                sender_id: "$sender_id",
                isread: "$isread",
              },
            },
            lastMessageTime: { $max: "$created_time" },
            isread: { $max: "$isread" },
          },
        },
        {
          $sort: {
            lastMessageTime: -1,
            isread: 1,
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
            shared_post_id: "$lastMessage.shared_post_id",
            shared_user_id: "$lastMessage.shared_user_id",
            shared_restaurant_id: "$lastMessage.shared_restaurant_id",
            message: "$lastMessage.message",
            isread: "$lastMessage.isread",
          },
        },
        {
          $project: {
            room_id: 1,
            sender_id: 1,
            created_time: 1,
            message: 1,
            shared_post_id: 1,
            shared_user_id: 1,
            shared_restaurant_id: 1,
            isread: 1,
          },
        },
      ]);
      return results;
    } catch (error) {
      throw error;
    }
  }
}
export default MongoDBMessageService;
