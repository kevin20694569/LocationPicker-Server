import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
class UserAccountController extends ControllerBase {
  private key = process.env.jwtKey;
  async login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    try {
      let user = await this.mysqlUsersTableService.selectuserfromemail(email);
      if (await bcrypt.compare(password, user.user_password)) {
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
}

export default UserAccountController;
