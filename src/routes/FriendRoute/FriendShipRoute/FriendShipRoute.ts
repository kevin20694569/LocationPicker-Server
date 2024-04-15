import RouteBase from "../../RouteBase";
import UserController from "../../../controller/APIController/UserController";
import FriendRequestController from "../../../controller/APIController/FriendRequestController";
import FriendShipController from "../../../controller/APIController/FriendShipController";

import { Request, Response, NextFunction } from "express";

class FriendShipRoute extends RouteBase {
  protected friendRequstController: FriendRequestController = new FriendRequestController();
  protected friendShipController: FriendShipController = new FriendShipController();

  protected registerRoute() {
    this.router.get("/:id", (req, res, next) => {
      this.friendShipController.getUserFriends(req, res, next);
    });
    this.router.delete("/", (req, res, next) => {
      this.friendShipController.removeFriendShip(req, res, next);
    });
    this.router.post("/accept", (req, res, next) => {
      this.friendShipController.acceptFriendRequestByEachUserID(req, res, next);
    });
  }
}

export default FriendShipRoute;
