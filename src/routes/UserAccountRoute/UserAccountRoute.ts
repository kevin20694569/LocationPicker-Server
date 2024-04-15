import RouteBase from "../RouteBase";
import UserAccountController from "../../controller/APIController/UserAccountController";

class UserAccountRoute extends RouteBase {
  protected userAccountController: UserAccountController = new UserAccountController();
  protected registerRoute() {
    this.router.post("/login", (req, res, next) => {
      this.userAccountController.login(req, res, next);
    });
    this.router.post("/register", (req, res, next) => {
      this.userAccountController.register(req, res, next);
    });
    this.router.put("/:id", (req, res, next) => {
      this.userAccountController.updateUserAccountDetail(req, res, next);
    });
  }
}

export default UserAccountRoute;
