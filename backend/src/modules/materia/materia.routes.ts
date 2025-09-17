import { Router } from "express";
import { materiaController } from "./materia.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO DA SEGURANÇA
import {
  createMateriaSchema,
  updateMateriaSchema,
  paramsSchema,
} from "./materia.validator";

const router = Router();

// Apenas ADMINISTRADOR pode criar, atualizar e deletar matérias.
router.post(
  "/",
  protect,
  authorize("ADMINISTRADOR"),
  validate(createMateriaSchema),
  materiaController.create
);

router.put(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate(updateMateriaSchema),
  materiaController.update
);

router.delete(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  materiaController.remove
);

// Todos os usuários autenticados (ADMINISTRADOR, PROFESSOR, ALUNO) podem visualizar as matérias.
router.get("/", protect, materiaController.findAll);

router.get(
  "/:id",
  protect,
  validate({ params: paramsSchema }),
  materiaController.findById
);

export const materiaRoutes = router;
