import { Router } from "express";
import { componenteController } from "./componenteCurricular.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  createComponenteSchema,
  updateComponenteSchema,
  paramsSchema,
  findAllComponentesSchema,
} from "./componenteCurricular.validator";

const router = Router();

// SEGURANÇA: Apenas ADMINS podem criar, editar e apagar
router.post(
  "/",
  protect,
  authorize("ADMINISTRADOR"),
  validate(createComponenteSchema),
  componenteController.create
);
router.put(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate(updateComponenteSchema),
  componenteController.update
);
router.delete(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  componenteController.remove
);

// SEGURANÇA: Todos os usuários autenticados podem visualizar
router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate(findAllComponentesSchema),
  componenteController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  componenteController.findById
);

export const componenteRoutes = router;
