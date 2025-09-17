import { Router } from "express";
import { instituicaoController } from "./instituicao.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  createInstituicaoSchema,
  updateInstituicaoSchema,
  paramsSchema,
} from "./instituicao.validator";

const router = Router();

// SEGURANÇA: Estas rotas devem ser acessadas APENAS por um Super Administrador.
// A lógica para diferenciar um Admin normal de um Super Admin seria feita no authorize ou no service.
router.post(
  "/",
  protect,
  authorize("ADMINISTRADOR"),
  validate(createInstituicaoSchema),
  instituicaoController.create
);
router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR"),
  instituicaoController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  instituicaoController.findById
);
router.put(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate(updateInstituicaoSchema),
  instituicaoController.update
);
router.delete(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  instituicaoController.remove
);

export const instituicaoRoutes = router;
