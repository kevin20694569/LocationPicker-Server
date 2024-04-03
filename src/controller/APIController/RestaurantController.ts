import { Request, Response, NextFunction } from "express";
import ControllerBase from "../ControllerBase";

class RestaurantController extends ControllerBase {
  async getRestaurantDetail(req, res: Response, next: NextFunction) {
    try {
      let place_id = req.params.id;
      let { latitude, longitude } = req.query;

      let result = await this.mysqlRestaurantsTableService.getrestaurantDistanceAndDetail(place_id, latitude, longitude);
      let business_times = await this.mongodbBusiness_TimeService.getPlaceBusinessTimes(place_id);
      let mergedResult = {
        ...result,
        ...business_times["_doc"],
      };
      if (result == null) {
        res.send("找不到餐廳");
        console.log("找不到餐廳");
        res.status(404);
      } else {
        res.json(mergedResult);
        res.status(200);
      }
    } catch (error) {
      console.log(error);
    }
  }
}

export default RestaurantController;
