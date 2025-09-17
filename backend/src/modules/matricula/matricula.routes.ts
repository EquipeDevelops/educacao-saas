import { Router } from "express";
import { matriculaController } from "./matricula.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  createMatriculaSchema,
  updateMatriculaSchema,
  paramsSchema,
  findAllMatriculasSchema,
} from "./matricula.validator";

const router = Router();

// SEGURANÇA: Apenas ADMINS podem criar, deletar e alterar o status de matrículas.
router.post(
  "/",
  protect,
  authorize("ADMINISTRADOR"),
  validate(createMatriculaSchema),
  matriculaController.create
);
router.delete(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  matriculaController.remove
);
router.patch(
  "/:id/status",
  protect,
  authorize("ADMINISTRADOR"),
  validate(updateMatriculaSchema),
  matriculaController.updateStatus
);

// ADMINS, PROFESSORES e ALUNOS podem visualizar matrículas (o serviço controlará o escopo do que cada um pode ver).
router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate(findAllMatriculasSchema),
  matriculaController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  matriculaController.findById
);

export const matriculaRoutes = router;
