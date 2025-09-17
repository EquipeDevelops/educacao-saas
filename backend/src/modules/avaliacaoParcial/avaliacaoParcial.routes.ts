import { Router } from "express";
import { avaliacaoController } from "./avaliacaoParcial.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  createAvaliacaoSchema,
  updateAvaliacaoSchema,
  paramsSchema,
  findAllAvaliacoesSchema,
} from "./avaliacaoParcial.validator";

const router = Router();

// SEGURANÇA: Apenas PROFESSORES podem criar, editar e apagar notas do boletim.
router.post(
  "/",
  protect,
  authorize("PROFESSOR"),
  validate(createAvaliacaoSchema),
  avaliacaoController.create
);
router.put(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate(updateAvaliacaoSchema),
  avaliacaoController.update
);
router.delete(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate({ params: paramsSchema }),
  avaliacaoController.remove
);

// Todos os papéis relevantes podem visualizar as avaliações.
router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate(findAllAvaliacoesSchema),
  avaliacaoController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  avaliacaoController.findById
);

export const avaliacaoRoutes = router;
