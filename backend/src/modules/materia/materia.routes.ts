import { Router } from "express";
import { materiaController } from "./materia.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createMateriaSchema,
  updateMateriaSchema,
  paramsSchema,
} from "./materia.validator";
import { z } from "zod";

const router = Router();

router.post(
  "/",
  protect,
  authorize("GESTOR"),
  validate(createMateriaSchema),
  materiaController.create
);

router.put(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate(updateMateriaSchema),
  materiaController.update
);

router.delete(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate(z.object({ params: paramsSchema })),
  materiaController.remove
);

router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  materiaController.findAll
);

export const materiaRoutes = router;
