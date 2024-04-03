import RouteBase from "../RouteBase";
import ReactionController from "../../controller/APIController/ReactionController";

class ReactionRoute extends RouteBase {
  protected reactionController: ReactionController = new ReactionController();

  protected registerRoute() {
    this.router.get("/post/:id", (req, res, next) => {
      this.reactionController.getPostReaction(req, res, next);
    });
    this.router.post("/post/:id", (req, res, next) => {
      this.reactionController.updateReaction(req, res, next);
    });
  }
}

export default ReactionRoute;
