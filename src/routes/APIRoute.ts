import RouteBase from "./RouteBase";
import PostRoute from "./PostRoute/PostRoute";
import UserRoute from "./UserRoute/UserRoute";
import RestaurantRoute from "./RestaurantRoute/RestaurantRoute";
import ReactionRoute from "./ReactionRoute/ReactionRoute";
import FriendRoute from "./FriendRoute/FriendRoute";
import ChatRoomRoute from "./ChatRoomRoute/ChatRoomRoute";
import "dotenv/config";
import jwt from "jsonwebtoken";
import UserAccountRoute from "./UserAccountRoute/UserAccountRoute";
import Refactor from "../refactor/RestaurantRefactor";

class ApiRoute extends RouteBase {
  private jwtKey: string = process.env.jwtKey;
  protected postRoute: PostRoute = new PostRoute();
  protected userRoute: UserRoute = new UserRoute();
  protected restaurantRoute: RestaurantRoute = new RestaurantRoute();
  protected reactionRoute: ReactionRoute = new ReactionRoute();
  protected friendRoute: FriendRoute = new FriendRoute();
  protected chatroomRoute: ChatRoomRoute = new ChatRoomRoute();
  protected userAccountRoute: UserAccountRoute = new UserAccountRoute();
  protected refactor: Refactor = new Refactor(process.env.DB_Password);

  protected registerRoute() {
    this.router.use("/useraccount", (req, res, next) => {
      this.userAccountRoute.router(req, res, next);
    });
    this.router.use("/", (req, res, next) => {
      this.jwtAuth(req, res, next);
    });
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
    this.router.post("/refact", async (req, res, next) => {
      await this.refactor.standardPlace();
      await this.refactor.standardUser();
      res.end();
    });
    this.router.use("/", (err, req, res, next) => {
      res.end();
    });
  }

  jwtAuth(req, res, next) {
    next();
    return;
    let auth = req.headers.authorization;
    let token = auth.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "no token" });
    } else {
      jwt.verify(token, this.jwtKey, async (err, decoded) => {
        if (err) {
          res.status(401).json({ message: "token error", detail: err });
          next(err);
          return;
        }
        next();
      });
    }
  }
}

export default ApiRoute;
