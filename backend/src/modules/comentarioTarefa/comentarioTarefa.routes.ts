import { Router } from "express";
import { comentarioController } from "./comentarioTarefa.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  createComentarioSchema,
  updateComentarioSchema,
  paramsSchema,
  findAllComentariosSchema,
} from "./comentarioTarefa.validator";

const router = Router();

// SEGURANÇA: Apenas PROFESSORES e ALUNOS autenticados podem interagir nos comentários.
router.post(
  "/",
  protect,
  authorize("PROFESSOR", "ALUNO"),
  validate(createComentarioSchema),
  comentarioController.create
);
router.put(
  "/:id",
  protect,
  authorize("PROFESSOR", "ALUNO"),
  validate(updateComentarioSchema),
  comentarioController.update
);
router.delete(
  "/:id",
  protect,
  authorize("PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  comentarioController.remove
);

router.get(
  "/",
  protect,
  authorize("PROFESSOR", "ALUNO"),
  validate(findAllComentariosSchema),
  comentarioController.findAllByTarefa
);

export const comentarioRoutes = router;
