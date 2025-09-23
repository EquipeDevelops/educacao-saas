import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth";
import { conquistasPorUnidadeController } from "./conquistasPorUnidade.controller";
import { validate } from "../../middlewares/validate";
import { toggleConquistaSchema } from "./conquistasPorUnidade.validator";

const router = Router();
router.get(
  "/",
  protect,
  authorize("GESTOR"),
  conquistasPorUnidadeController.findAll
);
router.post(
  "/toggle",
  protect,
  authorize("GESTOR"),
  validate(toggleConquistaSchema),
  conquistasPorUnidadeController.toggle
);

export const conquistasPorUnidadeRoutes = router;
