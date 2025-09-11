import { Router } from "express";
import { unidadeEscolarController } from "./unidadeEscolar.controller";
import { validate } from "../../middlewares/validate";
import {
  createUnidadeEscolarSchema,
  updateUnidadeEscolarSchema,
  paramsSchema,
} from "./unidadeEscolar.validator";

const router = Router();

router.post(
  "/",
  validate(createUnidadeEscolarSchema),
  unidadeEscolarController.create
);

router.get("/", unidadeEscolarController.findAll);

router.get("/:id", validate(paramsSchema), unidadeEscolarController.findById);

router.put(
  "/:id",
  validate(updateUnidadeEscolarSchema),
  unidadeEscolarController.update
);

router.delete("/:id", validate(paramsSchema), unidadeEscolarController.delete);

export const unidadeEscolarRoutes = router;
