import { Router } from "express";
import { usuarioController } from "./usuario.controller";
import { protect, authorize } from "../../middlewares/auth";
import multer from "multer";
import { validate } from "../../middlewares/validate";
import { createUserSchema, updateUserSchema } from "./usuario.validator";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authorize("GESTOR"));

router.post("/", validate(createUserSchema), usuarioController.create);
router.get("/", usuarioController.list);
router.get("/:id", usuarioController.getById);
router.put("/:id", validate(updateUserSchema), usuarioController.update);
router.delete("/:id", usuarioController.delete);

router.post(
  "/importar/alunos",
  upload.single("arquivo"),
  usuarioController.importarAlunos
);

export { router as usuarioRoutes };
