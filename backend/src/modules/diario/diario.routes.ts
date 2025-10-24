import { Router } from "express";
import { protect, authorize } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import { diarioController } from "./diario.controller";
import {
  atualizarPresencasSchema,
  createDiarioSchema,
  getRegistroSchema,
  listAlunosSchema,
  listRegistrosSchema,
  objetivosBnccSchema,
} from "./diario.validator";

const router = Router();

router.get(
  "/turmas",
  protect,
  authorize("PROFESSOR"),
  diarioController.listarTurmas
);

router.get(
  "/turmas/:componenteId/alunos",
  protect,
  authorize("PROFESSOR"),
  validate(listAlunosSchema),
  diarioController.listarAlunos
);

router.get(
  "/registros",
  protect,
  authorize("PROFESSOR"),
  validate(listRegistrosSchema),
  diarioController.listarRegistros
);

router.get(
  "/registros/:id",
  protect,
  authorize("PROFESSOR"),
  validate(getRegistroSchema),
  diarioController.obterRegistro
);

router.post(
  "/registros",
  protect,
  authorize("PROFESSOR"),
  validate(createDiarioSchema),
  diarioController.criarRegistro
);

router.post(
  "/registros/:id/presencas",
  protect,
  authorize("PROFESSOR"),
  validate(atualizarPresencasSchema),
  diarioController.atualizarPresencas
);

router.get(
  "/objetivos",
  protect,
  authorize("PROFESSOR"),
  validate(objetivosBnccSchema),
  diarioController.listarObjetivosBncc
);

export const diarioRoutes = router;
