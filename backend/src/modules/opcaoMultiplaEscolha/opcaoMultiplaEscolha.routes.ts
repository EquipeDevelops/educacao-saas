import { Router } from "express";
import { opcaoController } from "./opcaoMultiplaEscolha.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  setOpcoesSchema,
  questaoParamsSchema,
  updateOpcaoSchema,
  paramsSchema,
} from "./opcaoMultiplaEscolha.validator";

const router = Router();

// SEGURANÇA: Apenas PROFESSORES podem definir (criar/sobrescrever) as opções de uma questão.
router.post(
  "/questao/:questaoId",
  protect,
  authorize("PROFESSOR"),
  validate(setOpcoesSchema),
  opcaoController.setOpcoes
);

// Para consistência, adicionamos rotas para gerenciar uma única opção, também restritas a PROFESSORES.
router.put(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate(updateOpcaoSchema),
  opcaoController.update
);
router.delete(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate({ params: paramsSchema }),
  opcaoController.remove
);

// PROFESSORES e ALUNOS podem listar as opções de uma questão.
router.get(
  "/questao/:questaoId",
  protect,
  authorize("PROFESSOR", "ALUNO"),
  validate({ params: questaoParamsSchema }),
  opcaoController.findAllByQuestao
);

export const opcaoRoutes = router;
