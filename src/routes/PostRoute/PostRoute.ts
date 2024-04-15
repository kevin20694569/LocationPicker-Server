import RouteBase from "../RouteBase";
import PostController from "../../controller/APIController/PostController";
import UploadMediaController from "../../controller/ResourceController/UploadMediaController";
import NearLocationRoute from "./NearLocationRoute/NearLocationRoute";
import multer, { Multer, diskStorage, StorageEngine, FileFilterCallback } from "multer";
import { error } from "neo4j-driver";
class PostRoute extends RouteBase {
  protected postController: PostController = new PostController();
  protected nearLocationRoute: NearLocationRoute = new NearLocationRoute();
  protected uploadMediaController = new UploadMediaController();
  protected registerRoute() {
    this.router.use("/nearlocation", (req, res, next) => {
      this.nearLocationRoute.router(req, res, next);
    });
    this.router.get("/friendsbyordertime", (req, res, next) => {
      this.postController.getFriendsPostsOrderByTime(req, res, next);
    });
    this.router.get("/restaurants/:id", (req, res, next) => {
      this.postController.getRestaurantPosts(req, res, next);
    });
    this.router.get("/users/:id", (req, res, next) => {
      this.postController.getUserPosts(req, res, next);
    });
    this.router.get("/:id", (req, res, next) => {
      this.postController.getSinglePost(req, res, next);
    });
    this.router.post("/", async (req, res, next) => {
      try {
        await this.uploadMediaController.uploadPosts(req, res, next);
        await this.postController.uploadPost(req, res, next);
      } catch (error) {
        next(error);
      }
    });
    this.router.use((err: Error, req, res, next) => {
      console.log(err.message);
      res.status(500).send("Something broke!");
      res.end();
    });
  }

  /*protected getProgress(req: Request, res: Response, next: NextFunction) {
    const progress = progressStream({ length: "0" });
    req.pipe(progress);
    progress.headers = req.headers;
    progress.body = req.body;
    this.upload.none()(req, res, (err) => {
      let json = JSON.parse(req.body.json);

      (req as any).json = json;
      (req as any).socket_id = json.socket_id;
      (req as any).ioService = new SocketIOSingletonController();
      progress.on("progress", function (obj) {
        (req as any).ioService.emitUploadProgressToSocket(json.socket_id, obj.percentage);
      });
      this.upload.fields([{ name: "media" }])(progress, res, function (err) {
        req.files = progress.files.media;
        if (err) {
          next(err);
        }
        next();
      });
    });
  }*/
}

export default PostRoute;
