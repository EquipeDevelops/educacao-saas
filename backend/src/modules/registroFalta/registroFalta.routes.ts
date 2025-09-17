import { Router } from "express";
import { registroFaltaController } from "./registroFalta.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
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

// Todos os papéis relevantes podem visualizar os registros de falta.
router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate(findAllFaltasSchema),
  registroFaltaController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  registroFaltaController.findById
);

export const registroFaltaRoutes = router;
