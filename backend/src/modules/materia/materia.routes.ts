import { Router } from "express";
import { materiaController } from "./materia.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import { materiaDeleteSchema } from "./materia.schemas";
import {
  createMateriaSchema,
  updateMateriaSchema,
  paramsSchema,
} from "./materia.validator";

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
  // === AQUI ESTÁ A CORREÇÃO ===
  validate(materiaDeleteSchema), // Passamos o esquema completo que o validate espera
  materiaController.remove
);
router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  materiaController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  materiaController.findById
);

export const materiaRoutes = router;
