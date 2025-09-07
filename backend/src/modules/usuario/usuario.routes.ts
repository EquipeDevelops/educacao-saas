import { Router } from "express";
import { usuarioController } from "./usuario.controller";
import { validate } from "../../middlewares/validate";
import {
  createUsuarioSchema,
  updateUsuarioSchema,
  paramsSchema,
} from "./usuario.validator";

const router = Router();

router.post("/", validate(createUsuarioSchema), usuarioController.create);
router.get("/", usuarioController.findAll);
router.get("/:id", validate(paramsSchema), usuarioController.findById);
router.put("/:id", validate(updateUsuarioSchema), usuarioController.update);
router.delete("/:id", validate(paramsSchema), usuarioController.delete);

export const usuarioRoutes = router;
