import { Router } from "express";
import { alunoController } from "./aluno.controller";
import { protect, authorize } from "../../middlewares/auth";

const router = Router();

router.get("/", protect, authorize("GESTOR"), alunoController.findAll);

router.get(
  "/:id/boletim",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  alunoController.getBoletim
);

// Rota para buscar os dados de um aluno específico (incluindo seu nome)
router.get(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  alunoController.findOne // Garante que esta rota está aqui
);

export const alunoRoutes = router;
