import RouteBase from "../RouteBase";
import RestaurantController from "../../controller/APIController/RestaurantController";

class RestaurantRoute extends RouteBase {
  protected restaurantController: RestaurantController = new RestaurantController();

  protected registerRoute() {
    this.router.get("/:id", (req, res, next) => {
      this.restaurantController.getRestaurantDetail(req, res, next);
    });
  }
}

export default RestaurantRoute;
