import { Router } from "express";
import { usuarioController } from "./usuario.controller";
import { validate } from "../../middlewares/validate";
import { createUserSchema, updateUserSchema } from "./usuario.validator";
import { protect, authorize } from "../../middlewares/auth";

const router = Router();

router.post(
  "/",
  protect,
  authorize("GESTOR"),
  validate(createUserSchema),
  usuarioController.create
);

router.get("/", protect, authorize("GESTOR"), usuarioController.findAll);

router.get(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  usuarioController.findById
);

router.patch(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate(updateUserSchema),
  usuarioController.update
);

router.delete("/:id", protect, authorize("GESTOR"), usuarioController.remove);

export const usuarioRoutes = router;
