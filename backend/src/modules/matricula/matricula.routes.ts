import { Router } from "express";
import { matriculaController } from "./matricula.controller";
import { validate } from "../../middlewares/validate";
import {
  createMatriculaSchema,
  updateMatriculaSchema,
  paramsSchema,
} from "./matricula.validator";

const router = Router();

router.post("/", validate(createMatriculaSchema), matriculaController.create);

router.get("/", matriculaController.findAll);

router.get("/:id", validate(paramsSchema), matriculaController.findById);

router.patch(
  "/:id",
  validate(updateMatriculaSchema),
  matriculaController.update
);

router.delete("/:id", validate(paramsSchema), matriculaController.delete);

export const matriculaRoutes = router;
