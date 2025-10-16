import { Router } from "express";
import { unidadeEscolarController } from "./unidadeEscolar.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  createUnidadeSchema,
  updateUnidadeSchema,
  paramsSchema,
} from "./unidadeEscolar.validator";

const router = Router();

// SEGURANÇA: Apenas o ADMIN da instituição pode gerenciar suas unidades.
router.post(
  "/",
  protect,
  authorize("ADMINISTRADOR"),
  validate(createUnidadeSchema),
  unidadeEscolarController.create
);
router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR"),
  unidadeEscolarController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  unidadeEscolarController.findById
);
router.put(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate(updateUnidadeSchema),
  unidadeEscolarController.update
);
router.delete(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  unidadeEscolarController.remove
);

export const unidadeEscolarRoutes = router;
