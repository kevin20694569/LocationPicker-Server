import mongoose from "mongoose";
import { MessageModel, MessageType } from "./MongoDBModel";

class MongoDBMessageService {
  protected messageModel: mongoose.Model<any> = MessageModel;
  async saveMessageByRoomID(type: MessageType, room_ID, sender_ID, message) {
    let created_time = new Date();
    try {
      let messageModel = {
        type: type,
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

  async insertManySameMessage(
    type: MessageType,
    sender_id: number,
    room_ids: string[],
    message?: string,
    shared_Post_id?: string,
    shared_User_id?: number,
    shared_Restaurant_id?: string
  ) {
    try {
      let created_time = new Date();
      let insertData = [];
      room_ids.forEach((room_ID) => {
        let messageModel = {
          type: type,
          room_id: room_ID,
          sender_id: sender_id,
          message: message,
          shared_Post_id: shared_Post_id,
          shared_User_id: shared_User_id,
          shared_Restaurant_id: shared_Restaurant_id,
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
        .limit(limit)
        .select({
          type: 1,
          room_id: 1,
          sender_id: 1,
          message: 1,
          isRead: 1,
          shared_Post_id: 1,
          shared_User_id: 1,
          shared_Restaurant_id: 1,
          created_time: 1,
        });
      return results;
    } catch (error) {
      console.log(error);
      throw new Error("獲取roomid訊息失敗");
    }
  }

  async markMessagesAsRead(room_id: string) {
    try {
      const updateResult = await this.messageModel.updateMany({ room_id: room_id, isRead: false }, { $set: { isRead: true } });
      return updateResult;
    } catch (error) {
      console.log(error);
      throw new Error("獲取roomid訊息失敗");
    }
  }
}
export default MongoDBMessageService;
