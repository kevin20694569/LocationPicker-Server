import RouteBase from "../../RouteBase";
import UserController from "controller/APIController/UserController";
import FriendRequestController from "../../../controller/APIController/FriendRequestController";
import FriendShipController from "../../../controller/APIController/FriendShipController";

import { Request, Response, NextFunction } from "express";

class FriendRequestRoute extends RouteBase {
  protected friendRequstController: FriendRequestController = new FriendRequestController();
  protected friendShipController: FriendShipController = new FriendShipController();

  protected registerRoute() {
    this.router.get("/receive-friend-request", (req, res, next) => {
      this.friendRequstController.getUserFriendRecieveRequests(req, res, next);
    });
    this.router.get("/sent-friend-request", (req, res, next) => {
      this.friendRequstController.getUserFriendSentRequest(req, res, next);
    });
    this.router.post("/accept/:id", (req, res, next) => {
      this.friendShipController.acceptFriendRequest(req, res, next);
    });
    this.router.post("/send", (req, res, next) => {
      this.friendRequstController.sendFriendRequst(req, res, next);
    });
    this.router.delete("/", (req, res, next) => {
      this.friendRequstController.deleteFriendRequst(req, res, next);
    });
  }
}

export default FriendRequestRoute;
