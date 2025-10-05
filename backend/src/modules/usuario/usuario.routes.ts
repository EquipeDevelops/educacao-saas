import { Router } from "express";
import { usuarioController } from "./usuario.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import { z } from "zod"; // ✅ necessário para usar z.object
import {
  createUserSchema,
  updateUserSchema,
  paramsSchema,
  toggleStatusSchema, // ✅ schema completo para PATCH /:id/status
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
  validate(z.object({ params: paramsSchema })), // ✅ compatível com validate.ts
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
  validate(z.object({ params: paramsSchema })), // ✅ compatível com validate.ts
  usuarioController.remove
);

// ✅ Rota para ativar/desativar usuário
router.patch(
  "/:id/status",
  protect,
  authorize("GESTOR"),
  validate(toggleStatusSchema), // ✅ schema completo com body/query/params
  usuarioController.toggleStatus
);

export const usuarioRoutes = router;
