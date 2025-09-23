import { Router } from "express";
import { submissaoController } from "./submissao.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  createSubmissaoSchema,
  gradeSubmissaoSchema,
  paramsSchema,
  findAllSubmissoesSchema,
} from "./submissao.validator";

const router = Router();

// SEGURANÇA: Apenas ALUNOS podem criar (iniciar) uma submissão para uma tarefa.
router.post(
  "/",
  protect,
  authorize("ALUNO"),
  validate(createSubmissaoSchema),
  submissaoController.create
);

// SEGURANÇA: Apenas PROFESSORES podem avaliar uma submissão.
router.patch(
  "/:id/grade",
  protect,
  authorize("PROFESSOR"),
  validate(gradeSubmissaoSchema),
  submissaoController.grade
);

// Todos os usuários relevantes (ADMIN, PROFESSOR, ALUNO) podem visualizar.
// O serviço irá filtrar os resultados com base no papel do usuário.
router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate(findAllSubmissoesSchema),
  submissaoController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  submissaoController.findById
);

export const submissaoRoutes = router;
