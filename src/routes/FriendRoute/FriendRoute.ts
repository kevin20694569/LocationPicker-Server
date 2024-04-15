import RouteBase from "../RouteBase";
import UserController from "../../controller/APIController/UserController";
import FriendRequestController from "../../controller/APIController/FriendRequestController";
import FriendShipController from "../../controller/APIController/FriendShipController";
import FriendRequestRoute from "./FriendRequestRoute/FriendRequestRoute";
import FriendShipRoute from "./FriendShipRoute/FriendShipRoute";

import { Request, Response, NextFunction } from "express";

class FriendRoute extends RouteBase {
  protected friendRequstController: FriendRequestController = new FriendRequestController();
  protected friendShipController: FriendShipController = new FriendShipController();
  protected friendRequestRoute: FriendRequestRoute = new FriendRequestRoute();
  protected friendShipRoute: FriendShipRoute = new FriendShipRoute();

  protected registerRoute() {
    this.router.use("/friendrequests", (req, res, next) => {
      this.friendRequestRoute.router(req, res, next);
    });
    this.router.use("/friendships", (req, res, next) => {
      this.friendShipRoute.router(req, res, next);
    });
  }
}

export default FriendRoute;
