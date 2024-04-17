import "module-alias";
import MySQLTableControllerBase from "./MySQLTableServiceBase";
import { ResultSetHeader } from "mysql2";
class MySQLUsersTableService extends MySQLTableControllerBase {
  protected serverUserImageIP = this.serverIP + "/userimage/";
  protected selectString: string = `CONCAT( "${this.serverUserImageIP}" , imageid) as user_imageurl, NULL AS password`;
  constructor(password?: string) {
    super(password);
  }

  async insertuser(id: string, username: string, email: string, hashPassword: string, imageid?: string) {
    try {
      await this.getConnection();
      let query = `INSERT INTO users (id, name, email, password, imageid) VALUES (?, ?, ?, ?, ?)`;

      let params = [id, username, email, hashPassword, imageid];
      let [header, _] = await this.pool.query(query, params);
      return header as ResultSetHeader;
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async selectUserByEmail(email: string) {
    try {
      await this.getConnection();
      let query = `SELECT email, password FROM users WHERE email = ?`;

      let params = [email];
      let results: any[];
      let fields: any;
      [results, fields] = await this.pool.query(query, params);
      if (results.length < 1) {
        return null;
      }
      return results[0];
    } catch (error) {
      throw error;
    } finally {
      this.release();
    }
  }

  async modifyUserPostsCount(user_id: string, plusInt: Number) {
    try {
      await this.getConnection();
      let userquery = "update users set posts_count = posts_count + ? where id = ?;";
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
      await this.getConnection();

      let userquery = "update users set posts_count = ? where id = ?;";

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

  async setUserFriendsCount(user_id: string, target: Number) {
    try {
      //   await this.getConnection();
      let userquery = "update users set friends_count = ? where id = ?;";

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

  async updateUserFriendsCount(user_id: string, plusInt: number) {
    try {
      await this.getConnection();
      let userquery = "update users set friends_count = friends_count + ? where id = ?;";
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

  async updateUserDetail(user_id: string, name?: null, email?: null, password?: string | null, imageID?: string) {
    try {
      await this.getConnection();
      let userquery = "UPDATE users SET ";
      let userparams = [];

      if (name !== null && name !== undefined) {
        if (userparams.length > 0) {
          userquery += ", ";
        }
        userquery += "name = ?";
        userparams.push(name);
      }

      if (email !== null && email !== undefined) {
        if (userparams.length > 0) {
          userquery += ", ";
        }
        userquery += "email = ?";
        userparams.push(email);
      }

      if (password !== null && password !== undefined) {
        if (userparams.length > 0) {
          userquery += ", ";
        }
        userquery += "password = ?";
        userparams.push(password);
      }
      if (imageID !== null && imageID !== undefined) {
        if (userparams.length > 0) {
          userquery += ", ";
        }
        userquery += "imageid = ?";
        userparams.push(imageID);
      }
      userquery += " where id = ?;";
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
      let query = `select id from users;`;
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

  async getUserProfileByID(user_id: string) {
    try {
      await this.getConnection();
      let userquery = `SELECT *, ${this.selectString} FROM users WHERE id = ?`;
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

  async getUserByIDs(user_ids: string[]) {
    try {
      if (user_ids.length < 1) {
        return [];
      }
      await this.getConnection();
      let query = `select *, ${this.selectString}  from users where id in (?);`;
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
