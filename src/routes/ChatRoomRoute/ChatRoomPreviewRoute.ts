import RouteBase from "../RouteBase";
import ChatRoomController from "../../controller/APIController/ChatRoomController";
class ChatRoomPreviewRoute extends RouteBase {
  protected chatRoomController = new ChatRoomController();

  protected registerRoute() {
    this.router.post("/lastmessageorder/:id", (req, res, next) => {
      this.chatRoomController.getChatRoomPreviewsWithMessages(req, res, next);
    });
    this.router.get("/:id", (req, res, next) => {
      this.chatRoomController.getSingleChatRoomPreviewByRoomID(req, res, next);
    });
    this.router.post("/", (req, res, next) => {
      this.chatRoomController.getSingleChatRoomPreviewByUserIDs(req, res, next);
    });
  }
}

export default ChatRoomPreviewRoute;
