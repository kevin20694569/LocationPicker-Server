import socketIO from "socket.io";
import MongoDBMessageService from "../MongoDB/MongoDBMessageService";
import MongoDBChatRoomService from "../MongoDB/MongoDBChatRoomService";

class SocketIOSingletonService {
  static instance: SocketIOSingletonService;
  protected io: socketIO.Server;
  protected userToSocketIDArrayDict: object = {};
  protected socketIDToUserDict: object = {};
  protected socketIDToSocketDict: object = {};
  protected messageService = new MongoDBMessageService();
  protected chatRoomService = new MongoDBChatRoomService();
  constructor(server?) {
    if (!SocketIOSingletonService.instance) {
      this.io = new socketIO.Server(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      });
      this.registerChatSocketEvents();
      SocketIOSingletonService.instance = this;
    }
    return SocketIOSingletonService.instance;
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

      socket.on("isRead", async (roomid, messageIds) => {
        const result = await this.messageService.markMessagesAsRead(messageIds);
        socket.broadcast.to(roomid).emit("read", messageIds);
      });

      socket.on("message", async (data) => {
        try {
          let room_id = data.room_id;
          const message = data.message;
          const sender_id = data.sender_id;
          let messageData = await this.messageService.saveMessage(room_id, sender_id, message);
          let room = await this.chatRoomService.getRoomLastMessageByRoomID(room_id);

          let roomusersSocketArrayidsArray = [];
          room.room_users.forEach((userid) => {
            if (this.userToSocketIDArrayDict[userid]) {
              let socket = this.userToSocketIDArrayDict[userid];
              roomusersSocketArrayidsArray.push(socket);
            }
          });
          roomusersSocketArrayidsArray.forEach((socketidArray) => {
            socketidArray.forEach((socket_id) => {
              let socket = this.socketIDToSocketDict[socket_id];

              socket.emit("messages", [messageData]);
            });
          });
        } catch (error) {
          console.log(error);
        }
      });

      socket.on("sharePostByMessage", async (data) => {
        try {
          let sender_id = data.sender_id;
          let receive_ids = data.receive_ids;
          let message = data.message;
          let shared_post_id = data.shared_post_id;
          const rooms = await this.chatRoomService.getRoomsBySenderidAndRecieveids(sender_id, receive_ids);
          let roomMap = {};
          const room_ids = rooms.map((room) => {
            roomMap[room.room_id] = room;
            return room.room_id;
          });

          let roomusersSocketids = [];
          receive_ids.push(sender_id);
          let messageData = await this.messageService.insertManySameMessage(sender_id, room_ids, message, shared_post_id);
          let messageMap = {};
          messageData.forEach((message) => {
            if (message.shared_Post_id) {
              message["message"] = "分享了一則貼文";
            }

            let room = roomMap[message.room_id];
            let room_users = room.room_users;
            room_users.forEach((user_id) => {
              if (messageMap[user_id]) {
                messageMap[user_id].push(message);
              } else {
                messageMap[user_id] = [message];
              }
            });
          });
          receive_ids.forEach((userid) => {
            if (this.userToSocketIDArrayDict[userid]) {
              roomusersSocketids.push(this.userToSocketIDArrayDict[userid]);
            }
          });
          roomusersSocketids.forEach((socketidArray) => {
            socketidArray.forEach((socket_id) => {
              let user_id = this.socketIDToUserDict[socket_id];
              let socket = this.socketIDToSocketDict[socket_id];

              let messages = messageMap[user_id];
              if (messages.shared_post_id) {
              }
              socket.emit("messages", messages);
            });
          });
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

        console.log(`user_id :　${user_id}, socketID : ${socket.id}　斷開連接`);
      });
    });
  }

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
export default SocketIOSingletonService;
