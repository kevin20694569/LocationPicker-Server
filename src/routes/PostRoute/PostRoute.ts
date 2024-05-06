import RouteBase from "../RouteBase";
import PostController from "../../controller/APIController/PostController";
import NearLocationRoute from "./NearLocationRoute/NearLocationRoute";
class PostRoute extends RouteBase {
  protected postController: PostController;
  protected nearLocationRoute: NearLocationRoute;

  protected registerRoute() {
    this.postController = new PostController();
    this.nearLocationRoute = new NearLocationRoute();

    this.router.use("/nearlocation", this.nearLocationRoute.router);
    this.router.get("/friendsbyordertime", this.postController.getFriendsPostsOrderByTime);
    this.router.get("/restaurants/:id", this.postController.getRestaurantPosts);
    this.router.get("/users/:id", this.postController.getUserPosts);
    this.router.get("/:id", this.postController.getSinglePost);

    this.router.post("/", this.multer.fields([{ name: "media" }]), this.postController.uploadPost);

    this.router.put("/:id", this.postController.updatePost);

    this.router.delete("/:id", this.postController.deletePost);

    this.router.use((err: Error, req, res, next) => {
      console.log(err.message);
      res.status(500).send("Something broke!");
      res.end();
    });
  }
}

export default PostRoute;
