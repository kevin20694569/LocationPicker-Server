import RouteBase from "../RouteBase";
import ChatRoomPreviewRoute from "./ChatRoomPreviewRoute";
import ChatRoomController from "../../controller/APIController/ChatRoomController";
import MessageRoute from "./MessageRoute";
class ChatRoomRoute extends RouteBase {
  protected chatRoomPreviewRoute = new ChatRoomPreviewRoute();
  protected messageRoute = new MessageRoute();
  protected chatRoomController = new ChatRoomController();
  protected registerRoute() {
    this.router.use("/previews", (req, res, next) => {
      this.chatRoomPreviewRoute.router(req, res, next);
    });

    this.router.use("/messages", (req, res, next) => {
      this.messageRoute.router(req, res, next);
    });
    this.router.post("/", (req, res, next) => {
      this.chatRoomController.getChatRoom(req, res, next);
    });
  }
}

export default ChatRoomRoute;
