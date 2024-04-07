import mysql from "mysql2/promise";
import "dotenv/config";

abstract class MySQLTableControllerBase {
  private dbPassword: string = process.env.DB_Password as string;
  protected serverIP: string = process.env.ServerIP as string;
  protected pool: mysql.Pool;
  protected connection: mysql.PoolConnection;
  constructor(password?: string) {
    this.dbPassword = process.env.DB_Password as string;
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
      this.connection.release();
    }
  }
  async getConnection() {
    if (!this.connection) {
      try {
        this.connection = await this.pool.getConnection();
      } catch (error) {
        throw new Error(`mysql伺服器連接失敗 messag${(error as Error).message}`);
      }
    }
  }
}

export default MySQLTableControllerBase;
