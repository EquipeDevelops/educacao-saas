import { Router } from "express";
import { horarioController } from "./horarioAula.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import {
  createHorarioSchema,
  updateHorarioSchema,
  paramsSchema,
  findAllHorariosSchema,
} from "./horarioAula.validator";

const router = Router();

// SEGURANÇA: Apenas ADMINS podem criar, editar e apagar horários.
router.post(
  "/",
  protect,
  authorize("ADMINISTRADOR"),
  validate(createHorarioSchema),
  horarioController.create
);
router.put(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate(updateHorarioSchema),
  horarioController.update
);
router.delete(
  "/:id",
  protect,
  authorize("ADMINISTRADOR"),
  validate({ params: paramsSchema }),
  horarioController.remove
);

// Todos os usuários autenticados podem visualizar os horários.
router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate(findAllHorariosSchema),
  horarioController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  horarioController.findById
);

export const horarioRoutes = router;
