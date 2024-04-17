import { JsonWebTokenError } from "jsonwebtoken";
import driver from "./Neo4jDBDriver";
import { session, QueryResult, Session, Result } from "neo4j-driver";

class Neo4jFriendShipService {
  driver: typeof driver = driver;
  session = this.driver.session();
  async close() {
    // await this.driver.close();
  }

  async createUser(user_id: string) {
    try {
      let query = `
        MERGE (user:User {
          user_id: $user_id
        }) RETURN user
      `;
      let results = await this.session.run(query, {
        user_id,
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

  async sendFriendRequest(from_user_id: string, to_user_id: string) {
    try {
      if (from_user_id == to_user_id) {
        throw new Error("不得寄好友邀請給自己");
      }
      let query = `
      MATCH (user1:User {user_id: $from_user_id})
      MATCH (user2:User {user_id: $to_user_id})
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

  async acceptToCreateFriendship(accept_user_id: string, friend_request_id: string) {
    try {
      let query = `
      MATCH (user2: User { user_id : $accept_user_id })
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

  async acceptToCreateFriendshipByEachUserID(accept_user_id: string, sent_user_id: string) {
    try {
      let query = `
      MATCH (user1:User { user_id: $sent_user_id }), (user2:User { user_id: $accept_user_id })
      WHERE NOT EXISTS((user1)-[:USER1]-(:Friendship)-[:USER2]-(user2))
      AND NOT EXISTS((user2)-[:USER2]-(:Friendship)-[:USER1]-(user1))
      OPTIONAL MATCH (user1)-[:SENT_FRIEND_REQUEST]->(request:FriendRequest)-[:TO_USER]->(user2)
      WITH user1, user2, request
      WHERE request IS NOT NULL
      CREATE (user1)-[:USER1]->(friendship:Friendship {friendship_time: apoc.date.toISO8601(datetime().epochMillis, "ms")})-[:USER2]->(user2)
      DETACH DELETE request
      RETURN friendship;
      `;
      let results = await this.session.run(query, {
        sent_user_id,
        accept_user_id,
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

  async searchFriendsByUserID(user_id: string, excluded_user_id?: [string]): Promise<any[]> {
    try {
      if (!excluded_user_id) {
        excluded_user_id = null;
      }
      let query = `
      MATCH (u:User)-[*1]-(friendship:Friendship)-[*1]-(friend:User)
      WHERE u.user_id = $user_id
      AND ($excluded_user_id IS NULL OR NOT friend.user_id IN $excluded_user_id)
      RETURN friendship, friend
      `;
      let results = await this.session.run(query, { user_id, excluded_user_id });
      let objects = this.transFormToJSONNeo4jResults(results);
      return objects;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      this.close();
    }
  }

  // 29 49 friendship
  // 29 -> 8 friendReqeust
  // 30 -> 29 friendrequest
  // not friend

  async checkUsersAreFriend(from_user_id: string, to_user_id_Array: string[]) {
    try {
      let query = `
      MATCH (fromUser:User)-[*1]-(friendship:Friendship)-[*1]-(toUser:User)
      WHERE fromUser.user_id = $from_user_id AND toUser.user_id IN $to_user_id_Array
      RETURN toUser AS user, friendship AS friendship, null AS request, null AS requestSender, null AS receiveRequestUser
          
      UNION
            
      MATCH (fromUser:User)-[*1]->(request:FriendRequest)-[*1]->(toUser:User)
      WHERE fromUser.user_id = $from_user_id AND toUser.user_id IN $to_user_id_Array 
      RETURN toUser AS user, null AS friendship, request AS request, null AS requestSender, toUser AS receiveRequestUser
      
      UNION
      
      MATCH (fromUser:User)-[*1]->(request:FriendRequest)-[*1]->(toUser:User)
      WHERE fromUser.user_id IN $to_user_id_Array AND toUser.user_id = $from_user_id
      RETURN fromUser AS user, null AS friendship, request AS request, fromUser AS requestSender, null AS receiveRequestUser
      ORDER BY 
      CASE WHEN requestSender IS NOT NULL THEN 0 ELSE 1 END, 
      CASE WHEN receiveRequestUser IS NOT NULL THEN 0 ELSE 1 END, 
      CASE WHEN friendship IS NOT NULL THEN 0 ELSE 1 END
      `;
      let results = await this.session.run(query, { from_user_id, to_user_id_Array });
      let json = this.transFormToJSONNeo4jResults(results);
      return json;
    } catch (error) {
      throw error;
    } finally {
      this.close();
    }
  }

  async searchFriendRecieveRequestsByUserID(user_id: string, date: string): Promise<any[]> {
    if (date) {
    } else {
      date = new Date().toISOString();
    }
    try {
      let query = `
      MATCH (u: User)-[:SENT_FRIEND_REQUEST]->(f:FriendRequest)-[*1]->(user2: User { user_id : $user_id}) 
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
  async searchFriendSentRequestsByUserID(user_id: string, date: string): Promise<any[]> {
    if (date) {
    } else {
      date = new Date().toISOString();
    }

    try {
      let query = `
      MATCH ( User { user_id : $user_id} )-[ sent :SENT_FRIEND_REQUEST]->(f:FriendRequest)-[*1]->(user2: User ) 
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

  async deleteFriendShip(from_user_id: string, to_user_id: string) {
    try {
      let query = `
      MATCH (from_user : User {user_id: $from_user_id})-[*1]-(friendship:Friendship)-[*1]-(to_user :User {user_id: $to_user_id})
      DETACH DELETE friendship
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

  async deleteFriendRequest(from_user_id: string, to_user_id: string) {
    try {
      let query = `
      MATCH (from_user:User {user_id: $from_user_id})-[*1]-(request:FriendRequest)-[*1]-(to_user:User {user_id: $to_user_id})
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
        let json: any = {};
        let keys = record["keys"];
        for (const key of keys) {
          var result = record.get(key);
          if (result) {
            if (result.properties) {
              json[key] = result.properties;
              continue;
            }
          }
        }
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
