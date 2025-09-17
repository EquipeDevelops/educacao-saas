import { Router } from "express";
import { questaoController } from "./questao.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  createQuestaoSchema,
  updateQuestaoSchema,
  paramsSchema,
  findAllQuestoesSchema,
} from "./questao.validator";

const router = Router();

// SEGURANÇA: Apenas PROFESSORES podem criar, editar e deletar questões.
router.post(
  "/",
  protect,
  authorize("PROFESSOR"),
  validate(createQuestaoSchema),
  questaoController.create
);
router.put(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate(updateQuestaoSchema),
  questaoController.update
);
router.delete(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate({ params: paramsSchema }),
  questaoController.remove
);

// PROFESSORES e ALUNOS podem visualizar as questões.
router.get(
  "/",
  protect,
  authorize("PROFESSOR", "ALUNO"),
  validate(findAllQuestoesSchema),
  questaoController.findAllByTarefa
);
router.get(
  "/:id",
  protect,
  authorize("PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  questaoController.findById
);

export const questaoRoutes = router;
