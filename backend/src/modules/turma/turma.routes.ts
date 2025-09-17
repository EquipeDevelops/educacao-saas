import { Router } from "express";
import { turmaController } from "./turma.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO DA SEGURANÇA
import {
  createTurmaSchema,
  updateTurmaSchema,
  paramsSchema,
} from "./turma.validator";

const router = Router();

// SEGURANÇA: Todas as rotas agora exigem que o usuário esteja autenticado (protect).

// Apenas ADMINISTRADOR pode criar, atualizar e deletar turmas.
router.post(
  "/",
  protect,
  authorize("ADMINISTRADOR"),
  validate(createTurmaSchema),
  turmaController.create
);

router.put(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate(updateTurmaSchema),
  turmaController.update
);

router.delete(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  turmaController.remove
);

// ADMINISTRADOR e PROFESSOR podem visualizar as turmas.
router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR"),
  turmaController.findAll
);

router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR"),
  validate({ params: paramsSchema }),
  turmaController.findById
);

export const turmaRoutes = router;
