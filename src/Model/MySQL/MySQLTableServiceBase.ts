import mysql from "mysql2/promise";
import "dotenv/config";
abstract class MySQLTableControllerBase {
  private dbPassword: string = process.env.mysql_dbpassword as string;
  protected serverIP: string = process.env.serverip as string;
  protected host: string = process.env.mysql_host as string;
  protected user: string = process.env.mysql_user as string;
  protected mysql_DBName: string = process.env.mysql_dbname as string;
  protected pool: mysql.Pool;
  protected connection: mysql.PoolConnection;
  constructor(password?: string) {
    this.dbPassword = process.env.mysql_dbpassword as string;
    if (password) {
      this.dbPassword = password;
    }
    this.pool = mysql.createPool({
      host: this.host,
      user: this.user,
      password: this.dbPassword,
      database: this.mysql_DBName,
    });
  }

  release() {
    if (this.connection) {
      this.connection.release();

      this.pool.releaseConnection(this.connection);
    }
  }
  async getConnection() {
    if (!this.connection) {
      try {
        //   this.connection = await this.pool.getConnection();
      } catch (error) {
        throw new Error(`mysql伺服器連接失敗 messag${(error as Error).message}`);
      }
    }
  }
}

export default MySQLTableControllerBase;
