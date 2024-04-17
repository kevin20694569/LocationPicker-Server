import neo4j from "neo4j-driver";
import "dotenv/config";
const driver = neo4j.driver("neo4j://127.0.0.1:7687", neo4j.auth.basic("neo4j", process.env.mysql_dbpassword as string));

export default driver;
