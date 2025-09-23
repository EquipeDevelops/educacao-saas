import { Router } from "express";
import { turmaController } from "./turma.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createTurmaSchema,
  updateTurmaSchema,
  paramsSchema,
} from "./turma.validator";

const router = Router();

router.post(
  "/",
  protect,
  authorize("GESTOR"),
  validate(createTurmaSchema),
  turmaController.create
);
router.put(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate(updateTurmaSchema),
  turmaController.update
);
router.delete(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate({ params: paramsSchema }),
  turmaController.remove
);

router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  turmaController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  validate({ params: paramsSchema }),
  turmaController.findById
);

export const turmaRoutes = router;
