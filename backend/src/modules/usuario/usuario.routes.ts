import { Router } from "express";
import { usuarioController } from "./usuario.controller";
import { protect, authorize } from "../../middlewares/auth";
import multer from "multer";
import { validate } from "../../middlewares/validate";
import { CreateUserSchema, UpdateUserSchema } from "./usuario.validator";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Aplica proteção a todas as rotas de usuário
router.use(protect);

// Definição das rotas CRUD
router.post(
  "/",
  authorize("GESTOR"),
  validate(CreateUserSchema),
  usuarioController.create
);
router.get("/", authorize("GESTOR"), usuarioController.list); // Linha 19 do erro
router.get("/:id", authorize("GESTOR"), usuarioController.getById);
router.put(
  "/:id",
  authorize("GESTOR"),
  validate(UpdateUserSchema),
  usuarioController.update
);
router.delete("/:id", authorize("GESTOR"), usuarioController.delete);

// Rota de importação
router.post(
  "/importar/alunos",
  authorize("GESTOR"),
  upload.single("arquivo"),
  usuarioController.importarAlunos
);

export { router as usuarioRoutes };
