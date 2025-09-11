import { Router } from "express";
import { questaoController } from "./questao.controller";
import { validate } from "../../middlewares/validate";
import {
  createQuestaoSchema,
  updateQuestaoSchema,
  paramsSchema,
} from "./questao.validator";

const router = Router();

router.post("/", validate(createQuestaoSchema), questaoController.create);

router.get("/", questaoController.findAll);

router.get("/:id", validate(paramsSchema), questaoController.findById);

router.patch("/:id", validate(updateQuestaoSchema), questaoController.update);

router.delete("/:id", validate(paramsSchema), questaoController.delete);

export const questaoRoutes = router;
