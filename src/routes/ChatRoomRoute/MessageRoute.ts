import RouteBase from "../RouteBase";
import MessageController from "../../controller/APIController/MessageController";
class MessageRoute extends RouteBase {
  protected messageController = new MessageController();

  protected registerRoute() {
    this.router.get("/:id", (req, res, next) => {
      this.messageController.getChatRoomMessagesByRoom_id(req, res, next);
    });
    this.router.post("/", (req, res, next) => {
      this.messageController.getChatRoomMessagesByUser_IDs(req, res, next);
    });
  }
}

export default MessageRoute;
