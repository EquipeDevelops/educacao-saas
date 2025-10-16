// Caminho: backend/src/modules/registroFalta/registroFalta.routes.ts
import { Router } from "express";
import { registroFaltaController } from "./registroFalta.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createFaltaSchema,
  updateFaltaSchema,
  paramsSchema,
  findAllFaltasSchema,
} from "./registroFalta.validator";

const router = Router();

// SEGURANÇA: Apenas PROFESSORES podem criar, editar e apagar registros de falta.
router.post(
  "/",
  protect,
  authorize("PROFESSOR"),
  validate(createFaltaSchema),
  registroFaltaController.create
);
router.put(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate(updateFaltaSchema),
  registroFaltaController.update
);
router.delete(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate({ params: paramsSchema }),
  registroFaltaController.remove
);

// GESTORES, PROFESSORES e ALUNOS podem visualizar os registros de falta de seu colégio.
router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate(findAllFaltasSchema),
  registroFaltaController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  registroFaltaController.findById
);

export const registroFaltaRoutes = router;
