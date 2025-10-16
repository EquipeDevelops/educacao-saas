import { Router } from "express";
import horarioController from "./horarioAula.controller";
import { protect, authorize } from "../../middlewares/auth";

const router = Router();

router.post("/", protect, authorize("GESTOR"), horarioController.create);

router.delete(
  "/:id",
  protect,
  authorize("GESTOR"),
  horarioController.deleteHorarioAula
);

router.get(
  "/turma/:turmaId",
  protect,
  authorize("GESTOR"),
  horarioController.getHorariosByTurma
);

router.get(
  "/eventos",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  horarioController.getHorariosAsEventos
);

export default router;
