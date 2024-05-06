import mongoose, { PipelineStage } from "mongoose";
import { PostModel, StandardPostProjectOutput, RandomPostProjectOutput } from "./MongoDBModel";

class MongoDBPostService {
  protected postModel = PostModel;
  protected standardPostProjectOutput = StandardPostProjectOutput;
  protected randomPostProjectOutput = RandomPostProjectOutput;

  async insertPost(title: string, content: string, media: any[], user_id: string, location: any, restaurant_id: string, grade: number) {
    try {
      let postmodel = new this.postModel({
        title: title,
        content: content,
        media: media,
        user_id: user_id,
        created_at: new Date(),
        location: location,
        restaurant_id: restaurant_id,
        grade: grade,
      });

      await postmodel.save();

      return postmodel;
    } catch (error) {
      console.log(error);
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

  async getRandomPublicPostsFromDistance(longitude: number, latitude: number, distanceThreshold: number) {
    try {
      const results = await this.postModel.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [longitude, latitude] },
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
  }

  async getPostsFromPostsID(post_ids: string[]) {
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

  async getPostFromID(Post_ID: string) {
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

  async getRestaurantPostsFromRestaurantID(restaurant_id: string, date: Date) {
    try {
      const results = await this.postModel.aggregate([
        {
          $match: {
            restaurant_id: restaurant_id,
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
  async getNearLocationPostsFromFriendsByUserID(friend_ids: string[], distanceThreshold: number, latitude: number, longitude: number) {
    try {
      console.log(friend_ids);
      const results = await this.postModel.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [longitude, latitude] },
            distanceField: "distance",
            spherical: true,
          },
        },
        {
          $match: {
            user_id: { $in: friend_ids },
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

  async getPostsByUserID(user_id: string, date: Date) {
    try {
      const results = await this.postModel.aggregate([
        {
          $match: {
            user_id: user_id,
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

  async getFriendsPostByCreatedTime(friend_ids: string[], date: Date, longtitude: number, latitude: number) {
    try {
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
            user_id: { $in: friend_ids },
            created_at: { $lt: date },
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

  async updatePostReactionCount(post_id: string, needIncreaseReactionType, needDecreaseReactionType, likeAddCount) {
    try {
      let objectID = new mongoose.Types.ObjectId(post_id);

      const post = await this.postModel.findById(objectID);
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

  async deletePost(post_id: string) {
    let objectID = new mongoose.Types.ObjectId(post_id);
    const filter = { _id: objectID };
    const options = {
      returnOriginal: true,
    };
    const deletedPost = await this.postModel.findOneAndDelete(filter, options);
    return deletedPost;
  }

  updatePost = async (post_id: string, title?: string, content?: string, grade?: number) => {
    let objectID = new mongoose.Types.ObjectId(post_id);

    let set: { title?: string; content?: string; grade?: number } = {};
    if (title) {
      set.title = title;
    }
    if (content) {
      set.content = content;
    }
    if (grade) {
      set.grade = grade;
    }
    const update = { $set: set };
    const originalPost = await this.postModel.findByIdAndUpdate(objectID, update);
    return originalPost;
  };

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
