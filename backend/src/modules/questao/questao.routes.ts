import { Router } from "express";
import { questaoController } from "./questao.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createQuestaoSchema,
  updateQuestaoSchema,
  paramsSchema,
  findAllQuestoesSchema,
  deleteQuestaoSchema,
  findQuestaoByIdSchema,
} from "./questao.validator";

const router = Router();

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
  validate(deleteQuestaoSchema),
  questaoController.remove
);

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
  validate(findQuestaoByIdSchema),
  questaoController.findById
);

export const questaoRoutes = router;
