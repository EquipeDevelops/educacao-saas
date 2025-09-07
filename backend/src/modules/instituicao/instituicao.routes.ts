import { Router } from "express";
import { instituicaoController } from "./instituicao.controller";
import { validate } from "../../middlewares/validate";
import {
  createInstituicaoSchema,
  updateInstituicaoSchema,
  paramsSchema,
} from "./instituicao.validator";

const router = Router();

router.post(
  "/",
  validate(createInstituicaoSchema),
  instituicaoController.create
);

router.get("/", instituicaoController.findAll);

router.get("/:id", validate(paramsSchema), instituicaoController.findById);

router.put(
  "/:id",
  validate(updateInstituicaoSchema),
  instituicaoController.update
);

router.delete("/:id", validate(paramsSchema), instituicaoController.delete);

export const instituicaoRoutes = router;
