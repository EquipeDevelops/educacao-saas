import { Router } from "express";
import { tarefaController } from "./tarefa.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createTarefaSchema,
  updateTarefaSchema,
  paramsSchema,
  findAllTarefasSchema,
  publishTarefaSchema,
  deleteTarefaSchema,
} from "./tarefa.validator";

const router = Router();

router.post("/", protect, authorize("PROFESSOR"), tarefaController.create);

router.put(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate(updateTarefaSchema),
  tarefaController.update
);
router.delete(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate(deleteTarefaSchema),
  tarefaController.remove
);
router.patch(
  "/:id/publish",
  protect,
  authorize("PROFESSOR"),
  validate(publishTarefaSchema),
  tarefaController.publish
);

router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate(findAllTarefasSchema),
  tarefaController.findAll
);

router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  tarefaController.findById
);

export const tarefaRoutes = router;
