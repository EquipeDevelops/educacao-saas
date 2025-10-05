import { Router } from "express";
import { respostaController } from "./respostaSubmissao.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  saveRespostasSchema,
  gradeRespostaSchema,
} from "./respostaSubmissao.validator";

const router = Router();

// SEGURANÇA: Apenas ALUNOS podem salvar/enviar suas respostas para uma submissão.
router.post(
  "/submissao/:submissaoId/save",
  protect,
  authorize("ALUNO"),
  validate(saveRespostasSchema),
  respostaController.saveAnswers
);

// SEGURANÇA: Apenas PROFESSORES podem avaliar uma resposta individual.
router.patch(
  "/:id/grade",
  protect,
  authorize("PROFESSOR"),
  validate(gradeRespostaSchema),
  respostaController.gradeAnswer
);

export const respostaRoutes = router;
