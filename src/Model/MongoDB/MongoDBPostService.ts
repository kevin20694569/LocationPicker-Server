import mongoose, { PipelineStage } from "mongoose";
import { PostModel, StandardPostProjectOutput, RandomPostProjectOutput } from "./MongoDBModel";

class MongoDBPostService {
  protected postModel = PostModel;
  protected standardPostProjectOutput = StandardPostProjectOutput;
  protected randomPostProjectOutput = RandomPostProjectOutput;

  async insertPost(post_title, post_content, media_data, user_id, location, restaurant_id, grade) {
    try {
      let postmodel = new this.postModel({
        post_title: post_title,
        post_content: post_content,
        media_data: media_data,
        user_id: user_id,
        created_at: new Date(),
        location: location,
        restaurant_id: restaurant_id,
        grade: grade,
      });

      await postmodel.save();

      return postmodel;
    } catch (error) {
      throw new Error("新建貼文失敗");
    }
  }

  async getRandomPostsFromRestautants(restaurantIds) {
    let searchqueryArray: PipelineStage[] = this.getRandomPostaggregate(restaurantIds);
    let match: PipelineStage[] = [{ $match: { restaurant_id: { $in: restaurantIds } } }];

    for (const element of searchqueryArray) {
      match.push(element);
    }
    let randomPosts = await this.postModel.aggregate(match);
    if (randomPosts.length > 0) {
      return randomPosts.map((result) => result.randomPost);
    } else {
      throw new Error("錯誤nearlocation");
    }
  }

  getRandomPublicPostsFromDistance = async (long: number, lat: number, distanceThreshold: number) => {
    try {
      const results = await this.postModel.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [long, lat] },
            distanceField: "distance",
            spherical: true,
          },
        },
        {
          $match: {
            distance: { $gt: distanceThreshold },
          },
        },
        {
          $group: { _id: "$restaurant_id", posts: { $push: "$$ROOT" } },
        },
        {
          $addFields: {
            randomPost: {
              $arrayElemAt: ["$posts", { $floor: { $multiply: [{ $rand: {} }, { $size: "$posts" }] } }],
            },
          },
        },
        { $project: { randomPost: this.randomPostProjectOutput } },
        { $sort: { "randomPost.distance": 1 } },
        { $limit: 5 },
      ]);
      return results.map((result) => result.randomPost);
    } catch (error) {
      throw error;
    }
  };

  async getPostsFromPostsID(post_ids) {
    try {
      let ob_Ids = post_ids.map((id) => {
        let obID = new mongoose.Types.ObjectId(id);
        return obID;
      });

      const results = await this.postModel.aggregate([{ $match: { _id: { $in: ob_Ids } } }, { $project: this.standardPostProjectOutput }]);
      if (results.length > 0) {
        return results;
      } else {
        throw new Error("無此Post 搜尋ID錯誤");
      }
    } catch (error) {
      throw error;
    }
  }

  async getPostFromID(Post_ID) {
    try {
      let id = new mongoose.Types.ObjectId(Post_ID);
      const results = await this.postModel.aggregate([{ $match: { _id: id } }, { $project: this.standardPostProjectOutput }]);
      if (results.length > 0) {
        return results;
      } else {
        throw new Error("無此Post 搜尋ID錯誤");
      }
    } catch (error) {
      throw error;
    }
  }

  async getRestaurantPostsFromRestaurantID(Restaurant_ID: string, dateThreshold: string) {
    try {
      let date: Date;
      if (dateThreshold == undefined || dateThreshold == "") {
        date = new Date();
      } else {
        date = new Date(dateThreshold);
      }
      const results = await this.postModel.aggregate([
        {
          $match: {
            restaurant_id: Restaurant_ID,
            created_at: { $lt: date },
          },
        },
        { $project: this.standardPostProjectOutput },
        { $sort: { created_at: -1 } },
      ]);
      return results;
    } catch (error) {
      throw error;
    }
  }
  async getNearLocationPostsFromFriendsByUserID(friendIds: number[], distanceThreshold: number, lat: number, long: number) {
    try {
      const results = await this.postModel.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [long, lat] },
            distanceField: "distance",
            spherical: true,
          },
        },
        {
          $match: {
            user_id: { $in: friendIds },
            distance: { $gt: distanceThreshold },
          },
        },
        {
          $group: { _id: "$restaurant_id", posts: { $push: "$$ROOT" } },
        },
        {
          $addFields: {
            randomPost: {
              $arrayElemAt: ["$posts", { $floor: { $multiply: [{ $rand: {} }, { $size: "$posts" }] } }],
            },
          },
        },
        { $sort: { "randomPost.distance": 1 } },
        { $project: { randomPost: this.randomPostProjectOutput } },
        { $limit: 6 },
      ]);

      if (results.length > 0) {
        return results.map((result) => result.randomPost);
      } else {
        return [];
      }
    } catch (error) {
      throw error;
    }
  }

  async getPostsByUserID(user_id, dateThreshold) {
    if (!dateThreshold) {
      dateThreshold = new Date();
    }
    try {
      user_id = parseInt(user_id);
      const results = await this.postModel.aggregate([
        {
          $match: {
            user_id: user_id,
            created_at: { $lt: dateThreshold },
          },
        },
        { $project: this.standardPostProjectOutput },
        { $sort: { created_at: -1 } },
      ]);
      return results;
    } catch (error) {
      throw error;
    }
  }

  async getFriendsPostByCreatedTime(friend_Ids: number[], date: string, longtitude: number, latitude: number) {
    try {
      let gt_date: Date;
      if (date == undefined || date == "") {
        gt_date = new Date();
      } else {
        gt_date = new Date(date);
      }
      let match: PipelineStage[] = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [longtitude, latitude] },
            distanceField: "distance",
            spherical: true,
          },
        },
        {
          $match: {
            user_id: { $in: friend_Ids },
            created_at: { $lt: gt_date },
          },
        },
        { $project: this.standardPostProjectOutput },
        { $sort: { created_at: -1 } },
        { $limit: 6 },
      ];

      const posts = await this.postModel.aggregate(match);
      return posts;
    } catch (error) {
      throw error;
    }
  }

  async updatePostReactionCount(post_id, needIncreaseReactionType, needDecreaseReactionType, likeAddCount) {
    try {
      post_id = new mongoose.Types.ObjectId(post_id);

      const post = await this.postModel.findById(post_id);
      if (needIncreaseReactionType) {
        post.reactions[needIncreaseReactionType]++;
      }
      if (needDecreaseReactionType) {
        post.reactions[needDecreaseReactionType]--;
      }
      if (likeAddCount) {
        post.reactions["like"] += likeAddCount;
      }
      await post.save();
      return post;
    } catch (error) {
      throw new Error("Failed to increase reaction: " + error.message);
    }
  }

  async deletePost(post_id) {
    post_id = new mongoose.Types.ObjectId(post_id);
    const post = await this.postModel.deleteOne(post_id);
  }

  async calculateRestaurantAverage() {
    const result = await this.postModel.aggregate([
      {
        $group: {
          _id: "$restaurant_id", // 根据 restaurant_id 进行分组
          average_grade: { $avg: "$grade" }, // 计算 grade 字段的平均值
        },
      },
      {
        $project: {
          restaurant_id: "$_id",
          _id: 0,
          average_grade: 1,
        },
      },
    ]);
    return result;
  }

  protected getRandomPostaggregate(orderby): PipelineStage[] {
    return [
      {
        $group: { _id: "$restaurant_id", posts: { $push: "$$ROOT" } },
      },
      {
        $addFields: {
          randomPost: {
            $arrayElemAt: ["$posts", { $floor: { $multiply: [{ $rand: {} }, { $size: "$posts" }] } }],
          },
          sortOrder: { $indexOfArray: [orderby, "$_id"] },
        },
      },
      { $sort: { sortOrder: 1 } },
      { $project: { randomPost: this.randomPostProjectOutput } },
    ];
  }
}
export default MongoDBPostService;
