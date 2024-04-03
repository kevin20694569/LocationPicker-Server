import mysql from "mysql2/promise";
import "dotenv/config";

abstract class MySQLTableControllerBase {
  private dbPassword: string = process.env.DB_Password;
  protected serverIP: string = process.env.ServerIP;
  protected pool: mysql.Pool;
  protected connection?: mysql.PoolConnection;
  constructor(password?: string) {
    this.dbPassword = process.env.DB_Password;
    if (password) {
      this.dbPassword = password;
    }
    this.pool = mysql.createPool({
      host: "localhost",
      user: "root",
      password: this.dbPassword,
      database: "mysql_test",
    });
  }

  async release() {
    if (this.connection) {
      try {
        this.connection.release();
      } catch (error) {
        throw new Error(`關閉mysql 失敗 messgae : ${error.message}`);
      }
    }
  }
  async getConnection() {
    if (!this.connection) {
      try {
        this.connection = await this.pool.getConnection();
      } catch (error) {
        throw new Error(`mysql伺服器連接失敗 messag${error.message}`);
      }
    }
  }
}

export default MySQLTableControllerBase;
