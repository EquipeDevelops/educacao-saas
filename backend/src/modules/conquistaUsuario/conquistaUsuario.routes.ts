import { Router } from "express";
import { conquistaUsuarioController } from "./conquistaUsuario.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  grantConquistaSchema,
  paramsSchema,
  findAllConquistasUsuarioSchema,
} from "./conquistaUsuario.validator";

const router = Router();

router.post(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  validate(grantConquistaSchema),
  conquistaUsuarioController.grant
);
router.delete(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  validate({ params: paramsSchema }),
  conquistaUsuarioController.revoke
);

router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate(findAllConquistasUsuarioSchema),
  conquistaUsuarioController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  conquistaUsuarioController.findById
);

export const conquistaUsuarioRoutes = router;
