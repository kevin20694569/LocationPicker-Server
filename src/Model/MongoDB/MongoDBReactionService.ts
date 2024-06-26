import { ReactionModel, ReactionProjectOutput } from "./MongoDBModel";
import MongoDBPostService from "./MongoDBPostService";

class MongoDBReactionService {
  protected reactionModel = ReactionModel;
  protected reactionProject = ReactionProjectOutput;
  protected mongoDBPostService = new MongoDBPostService();

  async getPostReactions(post_id: string, selfUser_id: string, user_ids: string[], date: Date) {
    let results = await this.reactionModel.aggregate([
      {
        $match: { post_id: post_id, updated_at: { $lt: date } },
      },
      {
        $addFields: {
          isFriend: { $in: ["$user_id", user_ids] },
          reaction: {
            $function: {
              body: function (reaction) {
                // 内联的 JavaScript 函数，将整数值转换为字符串
                switch (reaction) {
                  case 0:
                    return "love";
                  case 1:
                    return "vomit";
                  case 2:
                    return "angry";
                  case 3:
                    return "sad";
                  case 4:
                    return "surprise";
                  default:
                    return null;
                }
              },
              args: ["$reaction"], // 函数参数
              lang: "js",
            },
          },
        },
      },
      {
        $sort: { isFriend: -1, updated_at: -1 }, // 根据 isFriend 字段进行排序，朋友的排在最前面
      },
      {
        $limit: 15,
      },
      {
        $match: { user_id: { $ne: selfUser_id } },
      },
      {
        $project: {
          post_id: 1,
          user_id: 1,
          liked: 1,
          reaction: 1,
          updated_at: 1,
          isFriend: 1,
          _id: 0,
        },
      },
    ]);

    return results;
  }

  async getPostsPublicReactions(post_ids: string[], selfUser_id: string, friend_ids: string[]) {
    let results = await this.reactionModel.aggregate([
      {
        $match: { post_id: { $in: post_ids }, user_id: { $ne: Number(selfUser_id) } },
      },
      {
        $group: {
          _id: "$post_id",
          reactions: { $push: "$$ROOT" }, // 将每个 post_id 的所有 reaction 放入一个数组中
        },
      },
      {
        $sort: { isFriend: 1, updated_at: -1 }, // 根据 isFriend 字段进行排序，朋友的排在最前面
      },
      {
        $project: {
          _id: 0,
          post_id: "$_id",
          reactions: {
            $slice: ["$reactions", 3], // 保留每个 reactions 数组的前三个元素
          },
        },
      },
    ]);

    return results;
  }

  async getSelfReaction(post_id: string, user_id: string) {
    let reaction = await this.reactionModel.findOne({ post_id: post_id, user_id: user_id });

    return reaction;
  }

  async getManyPostsSelfReaction(post_ids: string[], request_user_id: string) {
    let reactions = await this.reactionModel.aggregate([
      {
        $match: {
          post_id: { $in: post_ids },
          user_id: request_user_id,
        },
      },
    ]);

    return reactions;
  }

  async updateReaction(post_id: string, user_id: string, liked?: boolean, reactionInt?: number) {
    try {
      let reactionString = this.translateReactionToString(reactionInt);
      liked = liked ?? false;
      if (reactionString == null && liked == false) {
        let lastReactionRow: any = await this.reactionModel.findOneAndDelete({ post_id: post_id, user_id: user_id });

        let lastReaction = lastReactionRow.reaction;
        let lastLikedStatus = lastReactionRow.liked;
        let likedCount = lastLikedStatus ? -1 : 0;
        await this.mongoDBPostService.updatePostReactionCount(post_id, reactionString, lastReaction, likedCount);
        return;
      }
      const filter = { post_id: post_id, user_id: user_id };
      const update = {
        $set: {
          post_id: post_id,
          user_id: user_id,
          reaction: reactionInt,
          liked: liked,
          updated_at: new Date(),
        },
      };
      const options = { upsert: true };
      let lastReactionRow = await this.reactionModel.findOneAndUpdate(filter, update, options);
      if (lastReactionRow == null) {
        let likedNum = liked ? 1 : 0;
        await this.mongoDBPostService.updatePostReactionCount(post_id, reactionString, null, likedNum);
        return;
      }
      let { reaction: lastReactionRawValue, liked: lastLikedStatus } = lastReactionRow;
      if (lastReactionRawValue != reactionInt || liked != lastLikedStatus) {
        let likedCount;
        if (liked == lastLikedStatus) {
          likedCount = 0;
        } else {
          likedCount = liked ? 1 : -1;
        }

        if (lastReactionRawValue == null) {
          await this.mongoDBPostService.updatePostReactionCount(post_id, reactionString, null, likedCount);
        } else {
          const lastReactionType = this.translateReactionToString(lastReactionRawValue);
          await this.mongoDBPostService.updatePostReactionCount(post_id, reactionString, lastReactionType, likedCount);
        }
      }
      return;
    } catch (error) {
      throw new Error(`updateReaction失敗${error}`);
    }
  }

  deletePostAllReactions = async (post_id: string) => {
    let reactions = await this.reactionModel.deleteMany({ post_id: post_id });
    return reactions;
  };

  translateReactionToString(rawValue: number) {
    switch (rawValue) {
      case 0:
        return "love";
      case 1:
        return "vomit";
      case 2:
        return "angry";
      case 3:
        return "sad";
      case 4:
        return "surprise";
      default:
        return null;
    }
  }
  translateReactionToInt(string: string) {
    switch (string) {
      case "love":
        return 0;
      case "vomit":
        return 1;
      case "angry":
        return 2;
      case "sad":
        return 3;
      case "surprise":
        return 4;
      default:
        return null;
    }
  }
}

export default MongoDBReactionService;
