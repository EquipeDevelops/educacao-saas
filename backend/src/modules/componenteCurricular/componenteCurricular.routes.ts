import { Router } from "express";
import { componenteCurricularController } from "./componenteCurricular.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createComponenteCurricularSchema,
  updateComponenteCurricularSchema,
  paramsSchema,
} from "./componenteCurricular.validator";
import { z } from "zod";

const router = Router();

router.post(
  "/",
  protect,
  authorize("GESTOR"),
  validate(createComponenteCurricularSchema),
  componenteCurricularController.create
);

router.put(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate(updateComponenteCurricularSchema),
  componenteCurricularController.update
);

router.delete(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate(z.object({ params: paramsSchema })),
  componenteCurricularController.remove
);

router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  componenteCurricularController.findAll
);

router.get(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  validate(z.object({ params: paramsSchema })),
  componenteCurricularController.findById
);

export const componenteCurricularRoutes = router;
