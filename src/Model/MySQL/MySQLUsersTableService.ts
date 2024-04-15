import "module-alias";
import MySQLTableControllerBase from "./MySQLTableServiceBase";
import { error } from "neo4j-driver";
class MySQLUsersTableService extends MySQLTableControllerBase {
  protected serverUserImageIP = this.serverIP + "/userimage/";
  protected selectString: string = `CONCAT( "${this.serverUserImageIP}" , user_imageid) as user_imageurl, NULL AS user_password`;
  constructor(password?: string) {
    super(password);
  }

  async insertuser(username: String, imageid: String, email: String, hashPassword: String) {
    try {
      await this.getConnection();
      let query = `INSERT INTO users (user_name, user_imageid, user_email, user_password) VALUES (?, ?, ?, ?)`;
      let params = [username, imageid, email, hashPassword];
      let [header, fields] = await this.pool.query(query, params);
      return [header, fields];
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async selectuserfromemail(email: String) {
    try {
      await this.getConnection();
      let query = `SELECT user_email, user_password FROM users WHERE user_email = ?`;
      let params = [email];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(query, params);
      if (results.length < 1) {
        throw new Error("沒有這個User");
      }
      return results[0];
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async modifyUserPostsCount(user_id: Number, plusInt: Number) {
    try {
      await this.getConnection();
      let userquery = "update users set posts_count = posts_count + ? where user_id = ?;";
      let userparams = [plusInt, user_id];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(userquery, userparams);
      let user = results[0];

      return user;
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }
  async setUserPostsCount(user_id: number, target: number) {
    try {
      // await this.getConnection();

      let userquery = "update users set posts_count = ? where user_id = ?;";

      let userparams = [target, user_id];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(userquery, userparams);
      let user = results[0];
      return user;
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async setUserFriendsCount(user_id: Number, target: Number) {
    try {
      //   await this.getConnection();
      let userquery = "update users set friends_count = ? where user_id = ?;";

      let userparams = [target, user_id];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(userquery, userparams);
      let user = results[0];
      return user;
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async updateUserFriendsCount(user_id: number, plusInt: number) {
    try {
      await this.getConnection();
      let userquery = "update users set friends_count = friends_count + ? where user_id = ?;";
      let userparams = [plusInt, user_id];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(userquery, userparams);
      let user = results[0];

      return user;
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async updateUserDetail(user_id: number, name?: null, email?: null, password?: null, imageID?: string) {
    try {
      await this.getConnection();
      let userquery = "UPDATE users SET ";
      let userparams = [];

      if (name !== null && name !== undefined) {
        if (userparams.length > 0) {
          userquery += ", ";
        }
        userquery += "user_name = ?";
        userparams.push(name);
      }

      if (email !== null && email !== undefined) {
        if (userparams.length > 0) {
          userquery += ", ";
        }
        userquery += "user_email = ?";
        userparams.push(email);
      }

      if (password !== null && password !== undefined) {
        if (userparams.length > 0) {
          userquery += ", ";
        }
        userquery += "user_password = ?";
        userparams.push(password);
      }
      if (imageID !== null && imageID !== undefined) {
        if (userparams.length > 0) {
          userquery += ", ";
        }
        userquery += "user_imageid = ?";
        userparams.push(imageID);
      }
      userquery += " where user_id = ?;";
      userparams.push(user_id);

      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(userquery, userparams);
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async getAllUsers() {
    try {
      await this.getConnection();
      let query = `select user_id from users;`;
      var params = [];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(query, params);
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async getUserProfileByID(user_id: Number) {
    try {
      await this.getConnection();
      let userquery = `SELECT *, ${this.selectString} FROM users WHERE user_id = ?`;
      let userParams = [user_id];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(userquery, userParams);
      let user = results[0];
      return user;
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async getUserByIDs(user_ids: number[]) {
    try {
      if (user_ids.length < 1) {
        return [];
      }
      await this.getConnection();
      let query = `select *, ${this.selectString}  from users where user_id in (?);`;
      var params = [user_ids];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(query, params);
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }
}
export default MySQLUsersTableService;
