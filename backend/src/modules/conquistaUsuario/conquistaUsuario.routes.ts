import { Router } from "express";
import { conquistaUsuarioController } from "./conquistaUsuario.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  grantConquistaSchema,
  paramsSchema,
  findAllConquistasUsuarioSchema,
} from "./conquistaUsuario.validator";

const router = Router();

// SEGURANÇA: Apenas ADMINS e PROFESSORES podem conceder ou revogar conquistas.
router.post(
  "/",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR"),
  validate(grantConquistaSchema),
  conquistaUsuarioController.grant
);
router.delete(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR"),
  validate({ params: paramsSchema }),
  conquistaUsuarioController.revoke
);

// Todos os usuários autenticados podem visualizar as conquistas concedidas.
router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate(findAllConquistasUsuarioSchema),
  conquistaUsuarioController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  conquistaUsuarioController.findById
);

export const conquistaUsuarioRoutes = router;
