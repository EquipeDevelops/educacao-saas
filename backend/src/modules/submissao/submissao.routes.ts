import { Router } from "express";
import { submissaoController } from "./submissao.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import { z } from "zod";
import {
  createSubmissaoSchema,
  gradeSubmissaoSchema,
  finalizeSubmissaoSchema,
  paramsSchema,
  findAllSubmissoesSchema,
} from "./submissao.validator";

const router = Router();

router.post(
  "/",
  protect,
  authorize("ALUNO"),
  validate(createSubmissaoSchema),
  submissaoController.create
);


router.post(
  "/:id/finalizar",
  protect,
  authorize("ALUNO"),
  validate(finalizeSubmissaoSchema),
  submissaoController.finalizeByAluno
);
router.patch(
  "/:id/grade",
  protect,
  authorize("PROFESSOR"),
  validate(gradeSubmissaoSchema),
  submissaoController.grade
);

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
  validate(z.object({ params: paramsSchema })),
  submissaoController.findById
);

export const submissaoRoutes = router;
