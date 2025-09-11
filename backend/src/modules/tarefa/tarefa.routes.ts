import { Router } from "express";
import { tarefaController } from "./tarefa.controller";
import { validate } from "../../middlewares/validate";
import {
  createTarefaSchema,
  updateTarefaSchema,
  paramsSchema,
} from "./tarefa.validator";

const router = Router();

router.post("/", validate(createTarefaSchema), tarefaController.create);

router.get("/", tarefaController.findAll);

router.get("/:id", validate(paramsSchema), tarefaController.findById);

router.patch("/:id", validate(updateTarefaSchema), tarefaController.update);

router.delete("/:id", validate(paramsSchema), tarefaController.delete);

export const tarefaRoutes = router;
