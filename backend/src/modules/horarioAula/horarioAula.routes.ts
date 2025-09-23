import { Router } from "express";
import { horarioController } from "./horarioAula.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createHorarioSchema,
  updateHorarioSchema,
  paramsSchema,
  findAllHorariosSchema,
} from "./horarioAula.validator";

const router = Router();

router.post(
  "/",
  protect,
  authorize("GESTOR"),
  validate(createHorarioSchema),
  horarioController.create
);
router.put(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate(updateHorarioSchema),
  horarioController.update
);
router.delete(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate({ params: paramsSchema }),
  horarioController.remove
);

router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate(findAllHorariosSchema),
  horarioController.findAll
);
router.get(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate({ params: paramsSchema }),
  horarioController.findById
);

export const horarioRoutes = router;
