import RouteBase from "../RouteBase";
import PostController from "../../controller/APIController/PostController";
import progressStream from "progress-stream";
import multer, { Multer, diskStorage, StorageEngine } from "multer";
import shortUUID from "short-uuid";
import { Request, Response, NextFunction } from "express";
import path from "path";
import SocketIOSingletonController from "../../controller/SocketIO/SocketIOSingletonController";
import NearLocationRoute from "./NearLocationRoute/NearLocationRoute";
class PostRoute extends RouteBase {
  protected postController: PostController = new PostController();
  protected nearLocationRoute: NearLocationRoute = new NearLocationRoute();
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
  protected registerRoute() {
    this.router.use("/nearlocation", (req, res, next) => {
      this.nearLocationRoute.router(req, res, next);
    });
    this.router.get("/friends/:id", (req, res, next) => {
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
    this.router.post("/", this.getProgress.bind(this), (req, res, next) => {
      this.postController.uploadPost(req, res, next);
    });
    this.router.use((err: Error, req, res, next) => {
      console.log(err.message);
      res.status(500).send("Something broke!");
      res.end();
    });
  }

  protected getProgress(req: Request, res: Response, next: NextFunction) {
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
  }
}

export default PostRoute;
