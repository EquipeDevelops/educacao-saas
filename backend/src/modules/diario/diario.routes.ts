import { Router } from "express";
import { DiarioController } from "./diario.controller";
import { protect, authorize } from "../../middlewares/auth";

const diarioRoutes = Router();
const diarioController = new DiarioController();

diarioRoutes.post(
  "/",
  protect,
  authorize("PROFESSOR"),
  diarioController.create
);

export { diarioRoutes };
