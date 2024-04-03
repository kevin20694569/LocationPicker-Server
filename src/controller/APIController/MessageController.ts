import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";

class MessageController extends ControllerBase {
  protected postMediaFolderString = process.env.ServerIP + "/public/media";
  async getChatRoomMessagesByRoom_id(req: Request, res: Response, next: NextFunction) {
    try {
      let room_id = req.params.id;
      let { date } = req.query;
      var messages = await this.mongodbMessageService.getRoomMessage(room_id, date, 20);
      if (messages.length < 1) {
        res.json([]);
        res.status(200);
        return;
      }

      let shard_post_ids = [];
      let indexArray = [];

      messages.forEach((message, index) => {
        if (message.shared_Post_id) {
          shard_post_ids.push(message.shared_Post_id);
          indexArray.push(index);
        }
      });
      if (shard_post_ids.length > 0) {
        let restaurantsMap = {};
        let postsMap = {};
        let posts = await this.mongodbPostService.getPostsFromPostsID(shard_post_ids);
        let restaurants_ids = posts.map((post) => {
          let post_id = post.post_id.toHexString();
          postsMap[post_id] = post;
          return post.restaurant_id;
        });
        let restaurants = await this.mysqlRestaurantsTableService.getRestaurantsDetail(restaurants_ids);
        restaurants.forEach((restaurant) => {
          restaurantsMap[restaurant.restaurant_id] = restaurant;
        });
        indexArray.forEach((indexInMessagesArray) => {
          let message = messages[indexInMessagesArray];
          let post_id = message.shared_Post_id;
          let post = postsMap[post_id];
          let restaurant = restaurantsMap[post.restaurant_id];
          messages[indexInMessagesArray] = {
            ...message._doc,
            post: post,
            restaurant: restaurant,
          };
        });
      }
      res.json(messages);
      res.status(200);
      return;
    } catch (error) {
      res.status(404).send(error.message);
      console.log(error);
    } finally {
      res.status(200);
      res.end();
    }
  }
  async getChatRoomMessagesByUser_IDs(req: Request, res: Response, next: NextFunction) {
    try {
      let { user_ids } = req.body;
      let { date } = req.query;
      let chatroom = await this.mongodbChatRoomService.getRoomByUserEachids(user_ids);
      var messages = await this.mongodbMessageService.getRoomMessage(chatroom.room_id, date, 20);
      if (messages.length < 1) {
        res.json([]);
        res.status(200);
        return;
      }
      await this.mergeMessageData(messages);
      res.json(messages);
      res.status(200);
      return;
    } catch (error) {
      res.status(404).send(error.message);
      console.log(error);
    } finally {
      res.status(200);
      res.end();
    }
  }

  async mergeMessageData(messages: any[]) {
    try {
      let shard_post_ids = [];
      let indexArray = [];

      messages.forEach((message, index) => {
        if (message.shared_Post_id) {
          shard_post_ids.push(message.shared_Post_id);
          indexArray.push(index);
        }
      });
      if (shard_post_ids.length > 0) {
        let restaurantsMap = {};
        let postsMap = {};
        let posts = await this.mongodbPostService.getPostsFromPostsID(shard_post_ids);
        let restaurants_ids = posts.map((post) => {
          let post_id = post.post_id.toHexString();
          postsMap[post_id] = post;
          return post.restaurant_id;
        });
        let restaurants = await this.mysqlRestaurantsTableService.getRestaurantsDetail(restaurants_ids);
        restaurants.forEach((restaurant) => {
          restaurantsMap[restaurant.restaurant_id] = restaurant;
        });
        indexArray.forEach((indexInMessagesArray) => {
          let message = messages[indexInMessagesArray];
          let post_id = message.shared_Post_id;
          let post = postsMap[post_id];
          let restaurant = restaurantsMap[post.restaurant_id];
          messages[indexInMessagesArray] = {
            ...message._doc,
            post: post,
            restaurant: restaurant,
          };
        });
      }
      return messages;
    } catch (error) {
      throw error;
    }
  }
}

export default MessageController;
