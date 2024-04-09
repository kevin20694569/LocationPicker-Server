import { Request, Response, NextFunction, query, request } from "express";
import ControllerBase from "../ControllerBase";
import shortUUID from "short-uuid";
import multer, { Multer, diskStorage, StorageEngine, FileFilterCallback } from "multer";
import fs from "fs";
import path from "path";
import "dotenv/config";
import mongoose from "mongoose";

class PostController extends ControllerBase {
  protected storage: StorageEngine = diskStorage({
    destination: function (req: Request, file: Express.Multer.File, cb) {
      const postMediaFolder = path.resolve(__dirname, "../../../public/media/postmedia");
      cb(null, postMediaFolder);
    },
    filename: function (req, file: Express.Multer.File, cb) {
      const uuid = shortUUID.uuid();
      const mimeType = file.mimetype;
      let ext = "";
      if (mimeType.startsWith("image/")) {
        ext = ".jpg";
      } else if (mimeType.startsWith("video/")) {
        ext = ".mp4";
      }
      cb(null, uuid + ext);
    },
  });
  protected upload: Multer = multer({
    storage: this.storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 限制 100 MB
    },
    fileFilter(req: Request, file: Express.Multer.File, callback) {
      if (!file.mimetype.match(/^image|video\//)) {
        console.log("檔案格式錯誤");
        callback(new Error("檔案格式錯誤"));
      } else {
        callback(null, true);
      }
    },
  });

  protected postMediaFolderString = "/public/media";

  public async getNearLocationPostsWithPublic(req: Request, res: Response, next: NextFunction) {
    let { latitude, longitude, distance, user_id } = req.query;
    try {
      let posts = await this.mongodbPostService.getRandomPublicPostsFromDistance(
        parseFloat(longitude as string),
        parseFloat(latitude as string),
        parseFloat(distance as string)
      );
      let json = {};
      if (posts.length > 0) {
        json = await this.mergeDataFromPosts(posts, parseInt(user_id as string));
      }
      res.json(json);
      res.status(200);
    } catch (error) {
      console.log(error);
      res.status(404);
      res.send(error.message);
    } finally {
      res.end();
    }
  }

  public async getRestaurantPosts(req, res: Response, next: NextFunction) {
    try {
      let restaurant_id = req.params.id;
      let { date, user_id } = req.query;
      let dateObject = new Date();
      if (date) {
        dateObject = new Date(date);
      }
      let posts = await this.mongodbPostService.getRestaurantPostsFromRestaurantID(restaurant_id, dateObject);
      let json = await this.mergeDataFromPosts(posts, parseInt(user_id as string));

      res.json(json);
      res.status(200);
    } catch (error) {
      res.status(404).send(error.message);
      console.log(error);
    } finally {
      res.end();
    }
  }

  public async getNearLocationPostsWithFriends(req, res: Response, next: NextFunction) {
    let user_id = req.params.id;
    let { latitude, longitude, distance } = req.query;
    try {
      let friendResults = await this.neo4jFriendShipService.searchFriendsByUserID(user_id);

      let friend_ID_Array = friendResults.map((friend) => {
        return Number(friend.friend.user_ID);
      });
      let posts = await this.mongodbPostService.getNearLocationPostsFromFriendsByUserID(
        friend_ID_Array,
        parseFloat(distance),
        parseFloat(latitude),
        parseFloat(longitude)
      );
      let json = {};
      json = await this.mergeDataFromPosts(posts, parseInt(user_id as string));
      res.json(json);
      res.status(200);
      res.end();
    } catch (error) {
      console.log(error);
      res.status(500);
      res.send(error.message);
      res.end();
    }
  }

  public async getFriendsPostsOrderByTime(req, res: Response, next: NextFunction) {
    try {
      let friend_user_id = req.params.id;
      let { longitude, latitude, date, user_id } = req.query;
      let dateObject = new Date();
      if (date) {
        dateObject = new Date(date);
      }
      let results = await this.neo4jFriendShipService.searchFriendsByUserID(friend_user_id);

      const frined_Ids = results.map((result) => {
        return parseInt(result.friend.user_ID);
      });
      let posts = await this.mongodbPostService.getFriendsPostByCreatedTime(frined_Ids, dateObject, parseFloat(longitude), parseFloat(latitude));
      let json = await this.mergeDataFromPosts(posts, parseInt(user_id as string));

      res.json(json);
      res.status(200);
    } catch (error) {
      res.status(404).send(error.message);
      console.log(error);
    } finally {
      res.end();
    }
  }

  public async getUserPosts(req, res: Response, next: NextFunction) {
    try {
      let id = req.params.id;
      let user_id_number = parseInt(id as string);
      let { date, user_id } = req.query;
      let request_user_id_num = parseInt(user_id as string);
      let dateObject = new Date();
      if (date) {
        dateObject = new Date(date);
      }
      let posts = await this.mongodbPostService.getPostsByUserID(user_id_number, dateObject);
      let json = await this.mergeDataFromPosts(posts, request_user_id_num);
      res.json(json);
      res.status(200);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  public async getSinglePost(req, res: Response, next: NextFunction) {
    try {
      let id = req.params.id;
      let { request_user_id } = req.query;
      let posts = await this.mongodbPostService.getPostFromID(id);
      let data = await this.mergeDataFromPosts(posts, parseInt(request_user_id as string));
      let json = data[0];
      res.json(json);
    } catch (error) {
      res.status(404).send(error.message);
      console.log(error);
    } finally {
      res.end();
    }
  }

  public async uploadPost(req, res: Response, next: NextFunction) {
    try {
      let { user_id, post_title, post_content, restaurant_address, post_itemtitles, restaurant_name, restaurant_ID, grade, socket_id } = req.json;
      let { restaurant_id, restaurant_latitude, restaurant_longitude } = await this.mysqlRestaurantsTableService.findRestaurantID(
        restaurant_ID,
        grade
      );
      let files = req.files;
      if (files == undefined) {
        throw new Error("沒有選擇檔案上傳");
      }

      let media_data = files.map((file, index: number) => {
        const filename = `${file.filename}`;
        if (post_itemtitles[index] == "") {
          post_itemtitles[index] = null;
        }
        let model: { media_id: string; itemtitle: any; _id: any };
        model = {
          media_id: filename,
          itemtitle: post_itemtitles[index],
          _id: null,
        };
        return model;
      });

      const location = {
        type: "Point",
        coordinates: [restaurant_longitude, restaurant_latitude],
      };

      await this.mongodbPostService.insertPost(post_title, post_content, media_data, user_id, location, restaurant_id, grade);
      await this.mysqlRestaurantsTableService.updateRestaurantAverage_GradeWithInputGrade(restaurant_id, grade as number);
      await this.mysqlRestaurantsTableService.updateRestaurantPostsCountWithInput(restaurant_id, 1);
      await this.mysqlUsersTableService.modifyUserPostsCount(user_id, 1);

      req.ioService.emitUploadTaskFinished(socket_id, true);
      res.status(200).json("上傳成功");
    } catch (error) {
      console.log(error);
      await this.deletePost(error, req, res, next);
    } finally {
      res.end();
    }
  }

  public async deletePost(err: Error, req, res: Response, next: NextFunction) {
    let { socket_id, post_id } = req.json;
    await this.mongodbPostService.deletePost(req.post_id);
    req.files.forEach((file: Express.Multer.File) => {
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error("刪除檔案出錯：", err);
          return;
        }
        console.log("檔案刪除成功");
      });
    });
    req.ioService.emitUploadTaskFinished(socket_id, false);
    res.status(500).json({ message: "Internal server error" });
    res.end();
  }

  protected async mergeDataFromPosts(posts: any[], request_user_id: number) {
    if (posts.length < 1) {
      return [];
    }
    try {
      if (posts.length == 0) {
        return [];
      }
      let post_ids: string[] = [];
      let users_ids: number[] = [];
      let restaurant_ids = posts.map((post) => {
        let post_ObID: mongoose.Types.ObjectId = post.post_id;
        let post_id = post_ObID.toHexString();
        post_ids.push(post_id);
        users_ids.push(post.user_id);
        return post.restaurant_id;
      });
      let restaurants = await this.mysqlRestaurantsTableService.getRestaurantsDetail(restaurant_ids);
      let users = await this.mysqlUsersTableService.getUserByIDs(users_ids);
      let friends = await this.neo4jFriendShipService.searchFriendsByUserID(request_user_id);
      let friends_id = friends.map((friend) => {
        return friend.user_ID;
      });
      let selfReactions = await this.mongodbReactionService.getManyPostsSelfReaction(post_ids, request_user_id);
      let publicReactions = await this.mongodbReactionService.getPostsPublicReactions(post_ids, request_user_id, friends_id);
      let json = this.mergePostJsonProperties(posts, users, restaurants, selfReactions, publicReactions);
      return json;
    } catch (error) {
      throw error;
    }
  }

  async mergePostJsonProperties(posts: any[], users: any[], restaurants: any[], reactions: any[], publicReactions: any[]) {
    let usersMap = {};
    let restaurantsMap = {};
    let selfReactionsMap = {};
    let publicReactionsMap = {};
    users.forEach((user: { user_id: any }) => {
      usersMap[`${user.user_id}`] = user;
    });
    restaurants.forEach((restaurant: { [x: string]: string; restaurant_id: string }) => {
      restaurant["restaurant_imageurl"] = process.env.ServerIP + "/restaurantimage/" + restaurant.restaurant_id + ".jpg";
      restaurantsMap[`${restaurant.restaurant_id}`] = restaurant;
    });
    if (publicReactions) {
      publicReactions.forEach((reaction: { post_id: any }) => {
        publicReactionsMap[`${reaction.post_id}`] = reaction;
      });
    }

    if (reactions) {
      reactions.forEach((reaction: { post_id: any }) => {
        selfReactionsMap[`${reaction.post_id}`] = reaction;
      });
    }

    let result = posts.map((post: { post_id: { toHexString: () => any }; user_id: string | number; restaurant_id: string | number }) => {
      let post_id = post.post_id.toHexString();
      let user = usersMap[post.user_id];
      let restaurant = restaurantsMap[post.restaurant_id];
      let selfReaction = selfReactionsMap[post_id];
      let publicReactions = publicReactionsMap[post_id];
      if (selfReaction) {
        selfReaction = selfReaction;
      }
      if (publicReactions) {
        publicReactions = publicReactions.reactions;
      }
      let json = {
        postDetail: post,
        user: user,
        restaurant: restaurant,
        selfReaction: selfReaction,
        publicReactions: publicReactions,
      };
      return json;
    });
    return result;
  }
}

export default PostController;
