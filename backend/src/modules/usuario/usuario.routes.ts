import { Router } from "express";
import { usuarioController } from "./usuario.controller";
import { validate } from "../../middlewares/validate";
import {
  createUsuarioSchema,
  updateUsuarioSchema,
  paramsSchema,
} from "./usuario.validator";

import { authenticate } from "../../middlewares/authenticate";
import { checkRole } from "../../middlewares/checkRole";

const router = Router();

router.post(
  "/",
  authenticate,
  checkRole(["ADMINISTRADOR"]),
  validate(createUsuarioSchema),
  usuarioController.create
);

router.get(
  "/",
  authenticate,
  checkRole(["ADMINISTRADOR"]),
  usuarioController.findAll
);

router.get(
  "/:id",
  authenticate,
  checkRole(["ADMINISTRADOR", "PROFESSOR"]),
  validate(paramsSchema),
  usuarioController.findById
);

router.put(
  "/:id",
  authenticate,
  checkRole(["ADMINISTRADOR"]),
  validate(updateUsuarioSchema),
  usuarioController.update
);

router.delete(
  "/:id",
  authenticate,
  checkRole(["ADMINISTRADOR"]),
  validate(paramsSchema),
  usuarioController.delete
);

export const usuarioRoutes = router;
