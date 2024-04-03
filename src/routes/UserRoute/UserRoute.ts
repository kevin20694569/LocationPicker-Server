import RouteBase from "../RouteBase";
import UserController from "../../controller/APIController/UserController";

class UserRoute extends RouteBase {
  protected userController: UserController = new UserController();
  protected registerRoute() {
    this.router.post("/login", (req, res, next) => {
      this.userController.login(req, res, next);
    });
    this.router.post("/register", (req, res, next) => {
      this.userController.register(req, res, next);
    });
    this.router.get("/:id", (req, res, next) => {
      this.userController.getUserProfile(req, res, next);
    });
  }
}

export default UserRoute;
