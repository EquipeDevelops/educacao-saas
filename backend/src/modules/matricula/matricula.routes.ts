import { Router } from "express";
import { matriculaController } from "./matricula.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createMatriculaSchema,
  updateMatriculaSchema,
  paramsSchema,
  findAllMatriculasSchema,
} from "./matricula.validator";

const router = Router();

// SEGURANÇA: Apenas GESTORES podem criar, deletar e alterar o status de matrículas.
router.post(
  "/",
  protect,
  authorize("GESTOR"), // <-- Alterado para GESTOR
  validate(createMatriculaSchema),
  matriculaController.create
);
router.delete(
  "/:id",
  protect,
  authorize("GESTOR"), // <-- Alterado para GESTOR
  validate({ params: paramsSchema }),
  matriculaController.remove
);
router.patch(
  "/:id/status",
  protect,
  authorize("GESTOR"), // <-- Alterado para GESTOR
  validate(updateMatriculaSchema),
  matriculaController.updateStatus
);

// GESTORES, PROFESSORES e ALUNOS podem visualizar matrículas (o serviço controlará o escopo).
router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"), // <-- ADMIN removido
  validate(findAllMatriculasSchema),
  matriculaController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"), // <-- ADMIN removido
  validate({ params: paramsSchema }),
  matriculaController.findById
);

export const matriculaRoutes = router;
