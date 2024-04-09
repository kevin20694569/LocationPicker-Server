import RouteBase from "../RouteBase";
import UserController from "../../controller/APIController/UserController";

class UserRoute extends RouteBase {
  protected userController: UserController = new UserController();
  protected registerRoute() {
    this.router.get("/:id", (req, res, next) => {
      this.userController.getUserProfile(req, res, next);
    });
  }
}

export default UserRoute;
