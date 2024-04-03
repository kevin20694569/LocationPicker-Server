import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";

class ReactionController extends ControllerBase {
  protected postMediaFolderString = process.env.ServerIP + "/public/media";

  async getPostReaction(req: Request, res: Response, next: NextFunction) {
    let post_id = req.params.id;
    let { user_id } = req.body;
    let results = await this.neo4jFriendShipService.searchFriendsByUserID(user_id);

    let friends_ids = results.map((result) => {
      return result.friend.user_ID;
    });
    let reactions = await this.mongodbReactionService.getPostReactions(post_id, user_id, friends_ids);
    res.status(200);
    res.send(reactions);
    res.end();
  }

  async updateReaction(req: Request, res: Response, next: NextFunction) {
    let post_id = req.params.id;
    let { user_id, reaction, liked } = req.body;

    try {
      await this.mongodbReactionService.updateReaction(post_id, parseInt(user_id as string), liked as boolean, reaction);
      res.status(200);
      res.send("updateReaction成功");
    } catch (error) {
      console.log(error);
      res.status(404);
      res.send("updateReaction失敗");
    } finally {
      res.end();
    }
  }
}

export default ReactionController;
