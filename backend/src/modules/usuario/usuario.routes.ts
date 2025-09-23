import { Router } from "express";
import { usuarioController } from "./usuario.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createUserSchema,
  updateUserSchema,
  paramsSchema,
} from "./usuario.validator";

const router = Router();

router.post(
  "/",
  protect,
  authorize("GESTOR"),
  validate(createUserSchema),
  usuarioController.create
);

router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR", "GESTOR"),
  usuarioController.findAll
);

router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "GESTOR"),
  validate({ params: paramsSchema }),
  usuarioController.findById
);

router.put(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate(updateUserSchema),
  usuarioController.update
);

router.delete(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate({ params: paramsSchema }),
  usuarioController.remove
);

export const usuarioRoutes = router;
