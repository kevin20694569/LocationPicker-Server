import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class UserController extends ControllerBase {
  private key = "LocationPicker";

  async login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    try {
      let [users, fileds] = await this.mysqlUsersTableService.selectuserfromemail(email);
      if (users.length > 0 && (await bcrypt.compare(password, users[0].user_password))) {
        const token = jwt.sign(
          {
            email,
            username: users[0].username,
          },
          this.key
        );
        res.send({
          message: "成功",
          token,
        });
      } else {
        throw new Error("帳號或密碼錯誤");
      }
    } catch (error) {
      res.send(error.message);
      console.log(error);
    }
    res.end();
  }

  async register(req: Request, res: Response, next: NextFunction) {
    const { username, email, password } = req.body;
    let imageid = req.file !== undefined && req.file !== null ? `${req.file.filename}` : null;
    try {
      let [results, _] = await this.mysqlUsersTableService.selectuserfromemail(email);
      if (results.length > 0) {
        throw new Error("email已被註冊過 請直接登入");
      }
      const hashPassword = await bcrypt.hash(password, 10);
      let [header, fields] = await this.mysqlUsersTableService.insertuser(username, imageid, email, hashPassword);

      let user_id = header["insertId"];
      await this.mongodbUserService.createUser(user_id);
      let neoResults = await this.neo4jFriendShipService.createUser(user_id, username);
      res.send("註冊成功");
    } catch (error) {
      console.log(error.message);
      res.send(error.message);
    } finally {
      res.end();
    }
  }

  async getUserProfile(req, res: Response, next: NextFunction) {
    let id = req.params.id;
    let { request_user_id } = req.query;
    let { date } = req.query;
    if (date == undefined || date == "" || date == null) {
      date = new Date();
    } else {
      date = new Date(date);
    }
    try {
      let results = await this.mysqlUsersTableService.getUserProfileByID(id);
      let isFriend = await this.neo4jFriendShipService.checkIsFriend(request_user_id, id);
      results["isFriend"] = isFriend;
      if (results.length <= 0) {
        throw new Error("getUserProfile失敗");
      } else {
        res.json(results);
        res.status(200);
      }
    } catch (error) {
      res.status(404);

      console.log(error);
    } finally {
      res.end();
    }
  }
}

export default UserController;
