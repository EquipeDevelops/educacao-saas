import { Router } from "express";
import { opcaoController } from "./opcaoMultiplaEscolha.controller";
import { validate } from "../../middlewares/validate";
import {
  createOpcaoSchema,
  updateOpcaoSchema,
  paramsSchema,
} from "./opcaoMultiplaEscolha.validator";

const router = Router();

router.post("/", validate(createOpcaoSchema), opcaoController.create);

router.get("/", opcaoController.findAllByQuestao);

router.patch("/:id", validate(updateOpcaoSchema), opcaoController.update);

router.delete("/:id", validate(paramsSchema), opcaoController.delete);

export const opcaoRoutes = router;
