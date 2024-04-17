import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";

class MessageController extends ControllerBase {
  protected postMediaFolderString = process.env.serverip + "/public/media";
  async getChatRoomMessagesByRoom_id(req: Request, res: Response, next: NextFunction) {
    try {
      let room_id = req.params.id;
      let { date } = req.query;
      let dateObject = new Date();
      if (date) {
        dateObject = new Date(date as string);
      }

      var messages = await this.mongodbMessageService.getRoomMessage(room_id, dateObject, 20);

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
  async getChatRoomMessagesByUser_IDs(req: Request, res: Response, next: NextFunction) {
    try {
      let { user_ids } = req.body;
      let { date } = req.query;
      user_ids = user_ids as string[];
      let dateObject = new Date();
      if (date) {
        dateObject = new Date(date as string);
      }
      let chatroom = await this.mongodbChatRoomService.getRoomByUserEachids(user_ids);

      console.log(chatroom);
      var messages = await this.mongodbMessageService.getRoomMessage(chatroom._id, dateObject, 20);
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
      let shared_user_ids = [];
      let shared_restaurant_ids = [];
      let indexArray = [];

      messages.forEach((message, index) => {
        if (message.shared_post_id) {
          shard_post_ids.push(message.shared_post_id);
          indexArray.push(index);
        } else if (message.shared_user_id) {
          shared_user_ids.push(message.shared_user_id);
          indexArray.push(index);
        } else if (message.shared_restaurant_id) {
          shared_restaurant_ids.push(message.shared_restaurant_id);
          indexArray.push(index);
        }
      });
      if (shard_post_ids.length > 0 || shared_user_ids.length > 0 || shared_restaurant_ids.length > 0) {
        let restaurantsMap = {};
        let postsMap = {};
        let usersMap = {};
        let posts = await this.mongodbPostService.getPostsFromPostsID(shard_post_ids);
        let restaurants_ids = posts.map((post) => {
          let post_id = post.id.toHexString();
          postsMap[post_id] = post;
          return post.restaurant_id;
        });
        let users = await this.mysqlUsersTableService.getUserByIDs(shared_user_ids);
        let restaurants = await this.mysqlRestaurantsTableService.getRestaurantsDetail(restaurants_ids);
        restaurants.forEach((restaurant) => {
          restaurantsMap[restaurant.id] = restaurant;
        });
        users.forEach((user) => {
          usersMap[user.id] = user;
        });
        indexArray.forEach((indexInMessagesArray) => {
          let message = messages[indexInMessagesArray];
          if (message.shared_post_id) {
            let post_id = message.shared_post_id;
            let post = postsMap[post_id];
            let restaurant = restaurantsMap[post.restaurant_id];

            messages[indexInMessagesArray] = {
              ...message._doc,
              shared_post: post,
              shared_post_restaurant: restaurant,
            };
          }
          if (message.shared_user_id) {
            let user_id = message.shared_user_id;
            let user = usersMap[user_id];
            messages[indexInMessagesArray] = {
              ...message._doc,
              shared_user: user,
            };
          }
          if (message.shared_restaurant_id) {
            let restaurant_id = message.shared_restaurant_id;
            let restaurant = restaurantsMap[restaurant_id];

            messages[indexInMessagesArray] = {
              ...message._doc,
              shared_restaurant: restaurant,
            };
          }
        });
      }
      return messages;
    } catch (error) {
      throw error;
    }
  }
}

export default MessageController;
