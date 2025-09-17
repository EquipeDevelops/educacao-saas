import { Router } from "express";
import { usuarioController } from "./usuario.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- 1. IMPORTAÇÃO
import {
  createUserSchema,
  updateUserSchema,
  paramsSchema,
} from "./usuario.validator";

const router = Router();

// ARQUITETURA E SEGURANÇA: Aplicando os middlewares em todas as rotas.
// O fluxo agora é: Checa autenticação (protect) -> Checa permissão (authorize) -> Checa dados (validate) -> Executa controller.

router.post(
  "/",
  protect, // Garante que o usuário está logado
  authorize("ADMINISTRADOR"), // Garante que o usuário é um admin
  validate(createUserSchema),
  usuarioController.create
);

router.get("/", protect, authorize("ADMINISTRADOR"), usuarioController.findAll);

router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  usuarioController.findById
);

router.put(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate(updateUserSchema),
  usuarioController.update
);

router.delete(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  usuarioController.remove
);

export const usuarioRoutes = router;
