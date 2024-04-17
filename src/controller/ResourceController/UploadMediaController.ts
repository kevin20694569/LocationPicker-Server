import path from "path";
import fs from "fs";
import progressStream from "progress-stream";
import { NextFunction, Request, Response } from "express";
import multer, { Multer, diskStorage, StorageEngine, FileFilterCallback } from "multer";
import { nanoid } from "nanoid";
import SocketIOSingletonController from "../../controller/SocketIO/SocketIOSingletonController";
import { ProfiledPlan } from "neo4j-driver";
import { JsonWebTokenError } from "jsonwebtoken";
class UploadMediaController {
  protected postStorage: StorageEngine = diskStorage({
    destination: function (req: Request, file: Express.Multer.File, cb) {
      const postMediaFolder = path.resolve(__dirname, "../../../public/media/postmedia");
      cb(null, postMediaFolder);
    },
    filename: function (req, file: Express.Multer.File, cb) {
      const id = nanoid();
      const mimeType = file.mimetype;
      let ext = "";
      if (mimeType.startsWith("image/")) {
        ext = ".jpg";
      } else if (mimeType.startsWith("video/")) {
        ext = ".mp4";
      }
      cb(null, id + ext);
    },
  });

  protected postUpload: Multer = multer({
    storage: this.postStorage,
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
  protected userImageStorage: StorageEngine = diskStorage({
    destination: function (req: Request, file: Express.Multer.File, cb) {
      const postMediaFolder = path.resolve(__dirname, "../../../public/media/userimage");
      cb(null, postMediaFolder);
    },
    filename: function (req, file: Express.Multer.File, cb) {
      const id = nanoid();
      const mimeType = file.mimetype;
      let ext = "";
      if (mimeType.startsWith("image/")) {
        ext = ".jpg";
      } else {
        cb(new Error("檔案格式錯誤"), null);
        return;
      }
      cb(null, "userimage-" + id + ext);
    },
  });
  protected userImageUpload: Multer = multer({
    storage: this.userImageStorage,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter(req: Request, file: Express.Multer.File, callback) {
      if (!file.mimetype.match(/^image\//)) {
        callback(new Error("檔案格式錯誤"));
      } else {
        callback(null, true);
      }
    },
  });

  async uploadRestaurantImage(restaurant_id: string, data: any): Promise<void> {
    let filename: String = `${restaurant_id}.jpg`;

    const filePath = path.resolve(__dirname, `../../../public/media/restaurantimage/${filename}`);
    const writer = fs.createWriteStream(filePath);
    data.pipe(writer);
    return await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }

  async uploadPosts(req: Request, res: Response, next: NextFunction) {
    const progress = progressStream({ length: "0" });
    req.pipe(progress);
    progress.headers = req.headers;
    progress.body = req.body;
    await new Promise<void>((resolve, reject) => {
      this.postUpload.none()(req, res, (err) => {
        let { socket_id } = req.body;
        if (socket_id) {
          (req as any).ioService = new SocketIOSingletonController();
          progress.on("progress", function (obj) {
            (req as any).ioService.emitUploadProgressToSocket(socket_id, obj.percentage);
          });
        }
        this.postUpload.fields([{ name: "media" }])(progress, res, (err) => {
          req.files = progress.files.media;
          if (err) {
            reject(err);
          }
          resolve();
        });
      });
    });
  }
  // uploadUserImage(file : Multer)

  uploadUserImage(req: Request, res: Response, next: NextFunction) {
    return new Promise<string>((resolve, reject) => {
      this.userImageUpload.single("userimage")(req, res, (err: any) => {
        if (err) {
          reject(err);
        } else {
          if (req.file) {
            resolve(req.file.filename);
          } else {
            resolve(null);
          }
        }
      });
    });
  }
}

export default UploadMediaController;
