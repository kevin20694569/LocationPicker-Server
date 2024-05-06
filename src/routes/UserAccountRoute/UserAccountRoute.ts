import RouteBase from "../RouteBase";
import UserAccountController from "../../controller/APIController/UserAccountController";
import multer from "multer";

class UserAccountRoute extends RouteBase {
  protected userAccountController: UserAccountController = new UserAccountController();
  protected registerRoute() {
    this.router.post("/login", (req, res, next) => {
      this.userAccountController.login(req, res, next);
    });

    this.router.post("/register", this.multer.fields([{ name: "userimage" }]), (req, res, next) => {
      this.userAccountController.register(req, res, next);
    });
    this.router.put("/:id", this.multer.fields([{ name: "userimage" }]), (req, res, next) => {
      this.userAccountController.updateUserAccountDetail(req, res, next);
    });
  }
}

export default UserAccountRoute;
