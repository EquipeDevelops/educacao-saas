import { Router } from "express";
import { conquistaController } from "./conquista.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  createConquistaSchema,
  updateConquistaSchema,
  paramsSchema,
} from "./conquista.validator";

const router = Router();

// SEGURANÇA: Apenas ADMINS podem gerenciar o catálogo de conquistas.
router.post(
  "/",
  protect,
  authorize("ADMINISTRADOR"),
  validate(createConquistaSchema),
  conquistaController.create
);
router.put(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate(updateConquistaSchema),
  conquistaController.update
);
router.delete(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  conquistaController.remove
);

// SEGURANÇA: Todos os usuários autenticados podem ver as conquistas disponíveis.
router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  conquistaController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  conquistaController.findById
);

export const conquistaRoutes = router;
