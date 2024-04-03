import { Router } from "express";

class RouteBase {
  public router = Router();

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
