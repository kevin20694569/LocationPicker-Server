import path from "path";
import fs from "fs";
import progressStream from "progress-stream";
import { NextFunction, Request, Response } from "express";
import multer, { Multer, diskStorage, StorageEngine, FileFilterCallback } from "multer";
import { nanoid } from "nanoid";
import SocketIOSingletonController from "../../controller/SocketIO/SocketIOSingletonController";
import { buffer } from "stream/consumers";

import { ProfiledPlan, error } from "neo4j-driver";
import { JsonWebTokenError } from "jsonwebtoken";
class MediaResourceController {
  multer: Multer = multer();
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

  async uploadRestaurantImage(data: any, restaurant_id: string): Promise<string> {
    const filePath = path.resolve(__dirname, `../../../public/media/restaurantimage/${restaurant_id}.jpg`);
    const writer = fs.createWriteStream(filePath);
    data.pipe(writer);
    return await new Promise<string>((resolve, reject) => {
      writer.on("finish", () => {
        resolve(filePath);
      });
      writer.on("error", (err) => {
        reject(err);
      });
    });
  }

  uploadUserImage = async (buffer: Buffer, fileName: string) => {
    let filePath = path.resolve(__dirname, `../../../public/media/userimage/${fileName}.jpg`);
    const writer = fs.createWriteStream(filePath);
    writer.write(buffer, (err) => {
      if (err) {
        throw err;
      } else {
        writer.end();
      }
    });
    return await new Promise<string>((resolve, reject) => {
      writer.on("finish", () => {
        resolve(filePath);
      });
      writer.on("error", (err) => {
        reject(err);
      });
    });
  };

  uploadPostMedia = async (buffer: Buffer, fileName: string): Promise<string> => {
    let filePath = path.resolve(__dirname, `../../../public/media/postmedia/${fileName}`);
    const writer = fs.createWriteStream(filePath);
    writer.write(buffer, (err) => {
      if (err) {
        throw err;
      } else {
        writer.end();
      }
    });
    return await new Promise<string>((resolve, reject) => {
      writer.on("finish", () => {
        resolve(filePath);
      });
      writer.on("error", reject);
    });
  };

  deletePostMedia = async (fileName: string) => {
    let filePath = path.resolve(__dirname, `../../../public/media/postmedia/${fileName}`);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("刪除檔案出錯：", err);
        return;
      }
    });
  };
}

export default MediaResourceController;
