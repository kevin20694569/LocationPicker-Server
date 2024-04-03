import RouteBase from "../RouteBase";
import ChatRoomController from "../../controller/APIController/ChatRoomController";
import MessageController from "../../controller/APIController/MessageController";
class ChatRoomRoute extends RouteBase {
  protected chatRoomController = new ChatRoomController();
  protected messageController = new MessageController();

  protected registerRoute() {
    this.router.post("/requestuserid/:id", (req, res, next) => {
      this.chatRoomController.getChatRoomsPreviews(req, res, next);
    });
    this.router.get("/:id", (req, res, next) => {
      this.chatRoomController.getSingleChatRoomPreview(req, res, next);
    });
    this.router.post("/messages", (req, res, next) => {
      this.messageController.getChatRoomMessagesByUser_IDs(req, res, next);
    });
    this.router.get("/messages/:id", (req, res, next) => {
      this.messageController.getChatRoomMessagesByRoom_id(req, res, next);
    });
  }
}

export default ChatRoomRoute;
