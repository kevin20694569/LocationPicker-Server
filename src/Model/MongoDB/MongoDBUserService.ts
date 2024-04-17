import { UserModel } from "./MongoDBModel";

class MongoDBUserService {
  protected userModel = UserModel;
  async createUser(user_id: string) {
    try {
      let user = {
        user_id: user_id,
      };
      let result = await this.userModel.create(user);
      return result;
    } catch (error) {
      throw new Error("創建user失敗");
    }
  }

  async searchUserHaveRoomId(user_id: string, room_id: string) {
    let result = await this.userModel.findOne({ user_id: user_id }, { chatroom_ids: { $elemMatch: { $nin: [room_id] } } });

    return result.user_id;
  }

  async insertRoomIdToUser(user_ids: string[], room_id: string) {
    try {
      let results = await this.userModel.updateMany({ user_id: user_ids }, { $push: { chatroom_ids: room_id } }, { new: true });
      return results;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

export default MongoDBUserService;
