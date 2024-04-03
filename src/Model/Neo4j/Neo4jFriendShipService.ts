import driver from "./Neo4jDBDriver";
import { session, QueryResult, Session } from "neo4j-driver";

class Neo4jFriendShipService {
  driver: typeof driver = driver;
  session = this.driver.session();
  async close() {
    // await this.driver.close();
  }

  async createUser(user_id: Number, user_name: String) {
    try {
      let query = `
        MERGE (user:User {
          user_ID: $user_id,
          name : $user_name
        }) RETURN user
      `;
      let results = await this.session.run(query, {
        user_id,
        user_name,
      });
      if (results.records.length <= 0) {
        throw new Error("創建User失敗");
      }
      let objects = this.transFormToJSONNeo4jResults(results);
      return objects;
    } catch (error) {
      throw error;
    } finally {
      this.close();
    }
  }

  async sendFriendRequest(from_user_id: Number, to_user_id: Number) {
    try {
      if (from_user_id == to_user_id) {
        throw new Error("不得寄好友邀請給自己");
      }
      let query = `
      MATCH (user1:User {user_ID: $from_user_id})
      MATCH (user2:User {user_ID: $to_user_id})
      OPTIONAL MATCH (user1)-[*1]-(request:FriendRequest)-[*1]-(user2)
      OPTIONAL MATCH (user1)-[*1]-(friendship:Friendship)-[*1]-(user2)
      
      WITH user1, user2, request, friendship
      WHERE request IS NULL AND friendship IS NULL
      CREATE (user1)-[:SENT_FRIEND_REQUEST]->(newRequest:FriendRequest {sent_time: apoc.date.toISO8601(datetime().epochMillis, "ms")})
      CREATE (newRequest)-[:TO_USER]->(user2)
      RETURN newRequest as request ;
      `;

      let results = await this.session.run(query, {
        from_user_id,
        to_user_id,
      });
      if (results.records.length <= 0) {
        throw new Error("寄送邀請失敗");
      }

      let objects = this.transFormToJSONNeo4jResults(results);
      return objects;
    } catch (error) {
      throw error;
    } finally {
      this.close();
    }
  }

  async acceptToCreateFriendship(accept_user_id: Number, friend_request_id: Number) {
    try {
      let query = `
      MATCH (user2: User { user_ID : $accept_user_id })
      OPTIONAL MATCH (user1:User)-[:SENT_FRIEND_REQUEST]->(request:FriendRequest)-[:TO_USER]->(user2)
      WITH user1, user2, request
      WHERE id(request) = $friend_request_id
      WITH user1, user2, request
      CREATE (user1)-[:USER1]->(friendship:Friendship {friendship_time: apoc.date.toISO8601(datetime().epochMillis, "ms")})-[:USER2]->(user2)
      WITH request, friendship
      DETACH DELETE request
      return friendship;
      `;
      let results = await this.session.run(query, {
        accept_user_id,
        friend_request_id,
      });

      if (results.records.length <= 0) {
        throw new Error("接受邀請失敗");
      }
      let objects = this.transFormToJSONNeo4jResults(results);
      return objects;
    } catch (error) {
      throw error;
    } finally {
      this.close();
    }
  }

  async searchFriendsByUserID(user_id: number): Promise<any[]> {
    try {
      let query = `
        MATCH (u:User)-[*1]-(friendship:Friendship)-[*1]-(friend:User)
        WHERE u.user_ID = $user_id
        RETURN  friendship, friend
      `;
      let results = await this.session.run(query, { user_id });

      let objects = this.transFormToJSONNeo4jResults(results);
      return objects;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      this.close();
    }
  }

  async checkIsFriend(from_user_id: Number, to_user_id: Number) {
    try {
      let query = `
        MATCH (fromU:User)-[*1]-(friendship:Friendship)-[*1]-(toU:User)
        WHERE fromU.user_ID = $from_user_id AND toU.user_ID = $to_user_id
        RETURN friendship
      `;
      let results = await this.session.run(query, { from_user_id, to_user_id });

      let objects = this.transFormToJSONNeo4jResults(results);
      return objects.length != 0;
    } catch (error) {
      throw error;
    } finally {
      this.close();
    }
  }

  async searchFriendRecieveRequestsByUserID(user_id: number, date: string): Promise<any[]> {
    if (date) {
    } else {
      date = new Date().toISOString();
    }
    try {
      let query = `
      MATCH (u: User)-[:SENT_FRIEND_REQUEST]->(f:FriendRequest)-[*1]->(user2: User { user_ID : $user_id}) 
      WHERE f.sent_time < $date
      RETURN u AS from_user , f AS request
      ORDER BY f.sent_time DESC;`;
      let results = await this.session.run(query, { user_id, date });
      if (results.records.length <= 0) {
        throw new Error("沒有任何邀請");
      }

      let objects = this.transFormToJSONNeo4jResults(results);
      return objects;
    } catch (error) {
      throw error;
    } finally {
      this.close();
    }
  }
  async searchFriendSentRequestsByUserID(user_id: number, date: string): Promise<any[]> {
    if (date) {
    } else {
      date = new Date().toISOString();
    }
    try {
      let query = `
      MATCH ( User { user_ID : $user_id} )-[ sent :SENT_FRIEND_REQUEST]->(f:FriendRequest)-[*1]->(user2: User ) 
      WHERE f.sent_time < $date
      RETURN user2 AS to_user, f AS request
      ORDER BY f.sent_time DESC;`;
      let results = await this.session.run(query, { user_id, date });
      let objects = this.transFormToJSONNeo4jResults(results);
      return objects;
    } catch (error) {
      throw error;
    } finally {
      this.close();
    }
  }

  async deleteFriendShip(from_user_id: Number, to_user_id: Number) {
    try {
      let query = `
      MATCH (from_user : User {user_ID: $from_user_id})-[*1]-(friendship:Friendship)-[*1]-(to_user :User {user_ID: $to_user_id})
      DELET friendship
      Return from_user, to_user, friendship;      
      `;
      let results = await this.session.run(query, { from_user_id, to_user_id });
      if (results.records.length <= 0) {
        throw new Error("刪除朋友失敗");
      }
      let objects = this.transFormToJSONNeo4jResults(results);
      return objects;
    } catch (error) {
      throw error;
    } finally {
      this.close();
    }
  }

  async deleteFriendRequest(from_user_id: Number, to_user_id: Number) {
    try {
      let query = `
      MATCH (from_user:User {user_ID: $from_user_id})-[*1]-(request:FriendRequest)-[*1]-(to_user:User {user_ID: $to_user_id})
      Detach DELETE request
      return from_user, to_user, request;
      `;
      let results = await this.session.run(query, { from_user_id, to_user_id });
      if (results.records.length == 0) {
        throw new Error("刪除朋友邀請失敗");
      }
      let objects = this.transFormToJSONNeo4jResults(results);
      return objects;
    } catch (error) {
      throw error;
    } finally {
      this.close();
    }
  }
  transFormToJSONNeo4jResults(searchResults: QueryResult): object[] {
    try {
      let results = searchResults.records.map((record) => {
        let json = {};

        let keys = record["keys"];
        keys.forEach((key) => {
          var result = record.get(String(key));
          let id = (result.identity.high << 32) + result.identity.low;

          json[key] = result.properties;
          json[key][String(key) + "_ID"] = id;
        });
        return json;
      });
      return results;
    } catch (error) {
      console.log(error);
      throw new Error("transform results 失敗");
    }
  }
}
export default Neo4jFriendShipService;
