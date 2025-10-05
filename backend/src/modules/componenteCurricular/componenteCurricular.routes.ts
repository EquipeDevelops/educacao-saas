import { Router } from "express";
import { componenteController } from "./componenteCurricular.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createComponenteSchema,
  updateComponenteSchema,
  paramsSchema,
  findAllComponentesSchema,
} from "./componenteCurricular.validator";

const router = Router();

router.post(
  "/",
  protect,
  authorize("GESTOR"),
  validate(createComponenteSchema),
  componenteController.create
);
router.put(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate(updateComponenteSchema),
  componenteController.update
);
router.delete(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate({ params: paramsSchema }),
  componenteController.remove
);
router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate(findAllComponentesSchema),
  componenteController.findAll
);

router.get("/:id", protect, componenteController.findById);

export const componenteRoutes = router;
