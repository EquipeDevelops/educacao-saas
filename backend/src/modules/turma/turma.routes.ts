import { Router } from "express";
import { turmaController } from "./turma.controller";
import { validate } from "../../middlewares/validate";
import {
  createTurmaSchema,
  updateTurmaSchema,
  paramsSchema,
} from "./turma.validator";

const router = Router();

router.post("/", validate(createTurmaSchema), turmaController.create);

router.get("/", turmaController.findAll);

router.get("/:id", validate(paramsSchema), turmaController.findById);

router.put("/:id", validate(updateTurmaSchema), turmaController.update);

router.delete("/:id", validate(paramsSchema), turmaController.delete);

export const turmaRoutes = router;
