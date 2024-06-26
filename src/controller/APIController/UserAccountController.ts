import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import nodemailer from "nodemailer";
import multer, { Multer } from "multer";
class UserAccountController extends ControllerBase {
  private key = process.env.jwtKey;
  async login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    try {
      let user = await this.mysqlUsersTableService.selectUserByEmail(email);
      if (await bcrypt.compare(password, user.password)) {
        const payload = {
          email: email,
          name: user,
        };
        const expiresIn = "1h";
        const token = jwt.sign(payload, this.key, { expiresIn });
        res.setHeader("JwtToken", token);
        res.status(200);
        res.send({
          message: "成功",
        });
      } else {
        throw new Error("帳號或密碼錯誤");
      }
    } catch (error) {
      res.status(404);
      res.send({ error: error.message });
    } finally {
      res.end();
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    let files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let user_id = nanoid();
    let imageFile = files.userimage[0];
    let imageFileName = "userimage-" + nanoid();

    if (imageFile) {
      let filePath = await this.mediaResourceController.uploadUserImage(imageFile.buffer, imageFileName);
    }
    const { username, email, password } = req.body;

    try {
      let result = await this.mysqlUsersTableService.selectUserByEmail(email);
      if (result) {
        res.send("此email已被註冊過");
        return;
      }
      const hashPassword = await this.hashPassword(password);

      let header = await this.mysqlUsersTableService.insertuser(user_id, username, email, hashPassword, imageFileName);
      if (header.affectedRows != 1 && header.serverStatus != 2) {
        throw new Error("mysql新建userError");
      }
      await this.mongodbUserService.createUser(user_id);
      await this.neo4jFriendShipService.createUser(user_id);
      res.status(200);
      res.send("註冊成功");
    } catch (error) {
      console.log(error.message);
      res.send(error.message);
    } finally {
      res.end();
    }
  }

  async updateUserAccountDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const user_id = req.params.id;
      let files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let imageFile = files.userimage[0];
      let fileName: string;
      if (imageFile) {
        fileName = "userimage-" + nanoid();
        let filePath = await this.mediaResourceController.uploadUserImage(imageFile.buffer, fileName);
      }

      const { name, email, password } = req.body;
      let hashedPassword: string = null;
      if (password) {
        hashedPassword = await this.hashPassword(password);
      }
      await this.mysqlUsersTableService.updateUserDetail(user_id, name, email, hashedPassword, fileName);
      let user = await this.mysqlUsersTableService.getUserProfileByID(user_id);
      res.json(user);
      res.status(200);
    } catch (error) {
      res.status(400);
      res.send(error.message);
    } finally {
      res.end();
    }
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}

export default UserAccountController;
