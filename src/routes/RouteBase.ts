import { Router } from "express";
import multer, { Multer } from "multer";

class RouteBase {
  public router = Router();
  protected multer: Multer = multer();

  constructor() {
    this.initial();
  }

  protected initial(): void {
    this.router = Router();
    this.registerRoute();
  }

  protected registerRoute() {}
}
export default RouteBase;
