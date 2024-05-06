import RouteBase from "../../RouteBase";
import PostController from "../../../controller/APIController/PostController";
class NearLocationRoute extends RouteBase {
  protected postController: PostController;
  protected registerRoute() {
    this.postController = new PostController();
    this.router.get("/", this.postController.getNearLocationPostsWithPublic);

    this.router.get("/friendsbynearlocation", this.postController.getNearLocationPostsWithFriends);
  }
}

export default NearLocationRoute;
