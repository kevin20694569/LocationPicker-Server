import socketIO from "socket.io";
import ControllerBase from "../ControllerBase";
import { MessageType } from "../..//Model/MongoDB/MongoDBModel";
import { resultTransformers } from "neo4j-driver";
class SocketIOSingletonController extends ControllerBase {
  static instance: SocketIOSingletonController;
  protected io: socketIO.Server;
  protected userToSocketIDArrayDict: object = {};
  protected socketIDToUserDict: object = {};
  protected socketIDToSocketDict: object = {};
  constructor(server?) {
    super();
    if (!SocketIOSingletonController.instance) {
      this.io = new socketIO.Server(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      });
      this.registerChatSocketEvents();
      SocketIOSingletonController.instance = this;
    }
    return SocketIOSingletonController.instance;
  }

  registerChatSocketEvents() {
    this.io.on("error", (error) => {
      console.log(error);
    });

    this.io.on("connection", (socket) => {
      console.log("一個客戶端連接");
      let clientId = socket.id;
      this.socketIDToSocketDict[clientId] = socket;

      socket.on("error", (error) => {
        console.log(error);
      });

      socket.on("connectParams", (data) => {
        let user_id = data.user_id;
        let socket_id = data.socket_id;
        if (this.userToSocketIDArrayDict[user_id]) {
          this.userToSocketIDArrayDict[user_id].push(socket_id);
        } else {
          this.userToSocketIDArrayDict[user_id] = [socket_id];
        }
        this.socketIDToUserDict[socket_id] = user_id;
      });

      socket.on("joinRooms", (data) => {
        let chatRoomIDs = data.room_ids;

        chatRoomIDs.forEach((id) => {
          socket.join(id);
        });
      });

      socket.on("isRead", async (data) => {
        let room_id = data.room_id;
        await this.mongodbMessageService.markMessagesAsRead(room_id);

        const room = await this.mongodbChatRoomService.getRoomByRoomID(room_id);
        let room_users = room.room_users;
        let roomusersSocketids = [];
        room_users.forEach((userid) => {
          if (this.userToSocketIDArrayDict[userid]) {
            roomusersSocketids.push(this.userToSocketIDArrayDict[userid]);
          }
        });
        roomusersSocketids.forEach((socketidArray) => {
          socketidArray.forEach((socket_id: string) => {
            let socket = this.socketIDToSocketDict[socket_id];
            let json = {
              room_id: room.room_id,
            };
            socket.emit("messageIsRead", json);
          });
        });
      });

      socket.on("message", async (data) => {
        try {
          const message = data.message;
          const sender_id = data.sender_id;
          const receive_ids = data.receive_ids;
          await this.emitSendMessage(sender_id, receive_ids, message);
        } catch (error) {
          console.log(error);
        }
      });

      socket.on("sharePostByMessage", async (data) => {
        try {
          let sender_id = data.sender_id;
          let receive_ids = data.receive_ids;
          let shared_post_id = data.shared_post_id;
          await this.emitSendMessage(sender_id, receive_ids, null, shared_post_id, null);
        } catch (error) {
          console.log(error);
        }
      });
      socket.on("shareUserByMessage", async (data) => {
        try {
          let sender_id = data.sender_id;
          let receive_ids = data.receive_ids;
          let shared_user_id = data.shared_user_id;
          await this.emitSendMessage(sender_id, receive_ids, null, null, shared_user_id);
        } catch (error) {
          console.log(error);
        }
      });

      socket.on("shareRestaurantByMessage", async (data) => {
        try {
          let sender_id = data.sender_id;
          let receive_ids = data.receive_ids;
          let shared_restaurant_id = data.shared_restaurant_id;
          await this.emitSendMessage(sender_id, receive_ids, null, null, null, shared_restaurant_id);
        } catch (error) {
          console.log(error);
        }
      });

      socket.on("disconnect", () => {
        let user_id;
        if (this.socketIDToUserDict.hasOwnProperty(socket.id)) {
          user_id = this.socketIDToUserDict[socket.id];
          delete this.socketIDToSocketDict[socket.id];
        }
        if (this.userToSocketIDArrayDict.hasOwnProperty(user_id)) {
          let array = this.userToSocketIDArrayDict[user_id];
          let index = array.indexOf(socket.id);
          array.splice(index, 1);

          if (array.length == 0) {
            delete this.userToSocketIDArrayDict[user_id];
          } else {
            this.userToSocketIDArrayDict[user_id] = array;
          }
        }

        if (this.socketIDToUserDict.hasOwnProperty(socket.id)) {
          delete this.socketIDToUserDict[socket.id];
        }

        console.log(`user_id : ${user_id}, socketID : ${socket.id} 斷開連接`);
      });
    });
  }

  async emitSendMessage(
    sender_id: number,
    receive_ids: number[],
    message?: string,
    shared_post_id?: string,
    shared_user_id?: number,
    shared_restaurant_id?: string
  ) {
    const rooms = await this.mongodbChatRoomService.getRoomsBySenderidAndRecieveids(sender_id, receive_ids);
    let roomMap = {};
    const room_ids = rooms.map((room) => {
      roomMap[room.room_id] = room;
      return room.room_id;
    });
    let type: MessageType = MessageType.General;

    if (shared_post_id) {
      type = MessageType.PostShare;
    } else if (shared_user_id) {
      type = MessageType.UserShare;
    } else if (shared_restaurant_id) {
      type = MessageType.Restaurant;
    }
    receive_ids.push(sender_id);
    let messageData = await this.mongodbMessageService.insertManySameMessage(
      type,
      sender_id,
      room_ids,
      message,
      shared_post_id,
      shared_user_id,
      shared_restaurant_id
    );
    let roomusersSocketids = [];
    let messageMap = {};

    receive_ids.forEach((userid) => {
      if (this.userToSocketIDArrayDict[userid]) {
        roomusersSocketids.push(this.userToSocketIDArrayDict[userid]);
      }
    });
    for (let message of messageData) {
      if (message.shared_Post_id) {
        let posts = await this.mongodbPostService.getPostFromID(message.shared_Post_id);
        let post = posts[0];
        let restaurant = await this.mysqlRestaurantsTableService.getrestaurantDistanceAndDetail(post.restaurant_id);

        message["message"] = "分享了一則貼文";
        message = {
          ...message._doc,
          sharedPost: post,
          sharedPostRestaurant: restaurant,
        };
      } else if (message.shared_User_id) {
        let user = await this.mysqlUsersTableService.getUserProfileByID(message.shared_User_id);
        message = {
          ...message._doc,
          sharedUser: user,
        };
        message["message"] = "分享了一個帳號";
      } else if (message.shared_Restaurant_id) {
        let restaurant = await this.mysqlRestaurantsTableService.getrestaurantDistanceAndDetail(message.shared_Restaurant_id);
        message = {
          ...message._doc,
          sharedRestaurant: restaurant,
        };
        message["message"] = "分享了一個地點";
      }
      let room = roomMap[message.room_id];
      let room_users = room.room_users;
      for (let user_id of room_users) {
        if (messageMap[user_id]) {
          messageMap[user_id].push(message);
        } else {
          messageMap[user_id] = [message];
        }
      }
    }
    for (let socketidArray of roomusersSocketids) {
      for (let socket_id of socketidArray) {
        let user_id = this.socketIDToUserDict[socket_id];
        let socket = this.socketIDToSocketDict[socket_id];

        let message = messageMap[user_id];
        const jsonString = JSON.stringify(message);
        console.log(message);
        const buffer = Buffer.from(jsonString, "utf8");
        socket.emit("message", buffer);
      }
    }
  }

  getSocketsArray() {}

  emitUploadProgressToSocket(socket_id, progress) {
    let socket = this.socketIDToSocketDict[socket_id];
    let data = {
      progress: progress,
    };
    if (socket != null) {
      socket.emit("uploadProgress", data);
    }
  }

  emitUploadTaskFinished(socket_id, success) {
    let socket = this.socketIDToSocketDict[socket_id];
    let data = {
      success: success,
    };
    if (socket != null) {
      socket.emit("uploadTaskFinished", data);
    }
  }
}
export default SocketIOSingletonController;
