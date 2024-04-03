import mongoose from "mongoose";
import { MessageModel } from "./MongoDBModel";

class MongoDBMessageService {
  protected messageModel: mongoose.Model<any> = MessageModel;
  async saveMessage(room_ID, sender_ID, message) {
    let created_time = new Date();
    try {
      let messageModel = {
        room_id: room_ID,
        sender_id: sender_ID,
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

  async insertManySameMessage(sender_id, room_ids, message, shared_Post_id) {
    try {
      let created_time = new Date();
      let insertData = [];
      room_ids.forEach((room_ID) => {
        let messageModel = {
          room_id: room_ID,
          sender_id: sender_id,
          message: message,
          shared_Post_id: shared_Post_id,
          created_time: created_time,
        };
        insertData.push(messageModel);
      });
      let results = await this.messageModel.insertMany(insertData);
      return results;
    } catch (error) {
      throw error;
    }
  }

  async getRoomMessage(room_id, date, limit) {
    try {
      if (!date) {
        date = new Date();
      } else {
        date = new Date(date);
      }
      let results = await this.messageModel
        .find({
          room_id: room_id,
          created_time: { $lt: date },
        })
        .sort({ created_time: -1 })
        .limit(limit);
      return results;
    } catch (error) {
      console.log(error);
      throw new Error("獲取roomid訊息失敗");
    }
  }

  async markMessagesAsRead(message_Ids) {
    try {
      const updateResult = await this.messageModel.updateMany({ _id: { $in: message_Ids }, isRead: false }, { $set: { isRead: true } });
      return updateResult;
    } catch (error) {
      console.log(error);
      throw new Error("獲取roomid訊息失敗");
    }
  }
}
export default MongoDBMessageService;
