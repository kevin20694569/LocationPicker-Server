import RouteBase from "../../RouteBase";
import PostController from "../../../controller/APIController/PostController";
class NearLocationRoute extends RouteBase {
  protected postController: PostController = new PostController();
  protected registerRoute() {
    this.router.get("/", (req, res, next) => {
      this.postController.getNearLocationPostsWithPublic(req, res, next);
    });
    this.router.get("/friends/:id", (req, res, next) => {
      this.postController.getNearLocationPostsWithFriends(req, res, next);
    });
  }
}

export default NearLocationRoute;
