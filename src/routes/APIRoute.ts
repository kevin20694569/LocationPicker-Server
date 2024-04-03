import RouteBase from "./RouteBase";
import PostRoute from "./PostRoute/PostRoute";
import UserRoute from "./UserRoute/UserRoute";
import RestaurantRoute from "./RestaurantRoute/RestaurantRoute";
import ReactionRoute from "./ReactionRoute/ReactionRoute";
import FriendRoute from "./FriendRoute/FriendRoute";
import ChatRoomRoute from "./ChatRoomRoute/ChatRoomRoute";
class ApiRoute extends RouteBase {
  protected postRoute: PostRoute = new PostRoute();
  protected userRoute: UserRoute = new UserRoute();
  protected restaurantRoute: RestaurantRoute = new RestaurantRoute();
  protected reactionRoute: ReactionRoute = new ReactionRoute();
  protected friendRoute: FriendRoute = new FriendRoute();
  protected chatroomRoute: ChatRoomRoute = new ChatRoomRoute();

  protected registerRoute() {
    this.router.use("/posts", (req, res, next) => {
      this.postRoute.router(req, res, next);
    });
    this.router.use("/users", (req, res, next) => {
      this.userRoute.router(req, res, next);
    });
    this.router.use("/restaurants", (req, res, next) => {
      this.restaurantRoute.router(req, res, next);
    });
    this.router.use("/reactions", (req, res, next) => {
      this.reactionRoute.router(req, res, next);
    });
    this.router.use("/friends", (req, res, next) => {
      this.friendRoute.router(req, res, next);
    });
    this.router.use("/chatrooms", (req, res, next) => {
      this.chatroomRoute.router(req, res, next);
    });
  }
}

export default ApiRoute;
