import { Router } from "express";
import { submissaoController } from "./submissao.controller";
import {
  createSubmissaoSchema,
  gradeSubmissaoSchema,
} from "./submissao.validator";
import { validate } from "../../middlewares/validate";

import { respostaController } from "../respostaSubmissao/respostaSubmissao.controller";
import { createRespostasSchema } from "../respostaSubmissao/respostaSubmissao.validator";

const router = Router();

router.post("/", validate(createSubmissaoSchema), submissaoController.create);

router.get("/", submissaoController.findAll);

router.get("/:id", submissaoController.findById);

router.patch(
  "/:id/grade",
  validate(gradeSubmissaoSchema),
  submissaoController.grade
);

router.post(
  "/:submissaoId/respostas",
  validate(createRespostasSchema),
  respostaController.createMany
);

export const submissaoRoutes = router;
