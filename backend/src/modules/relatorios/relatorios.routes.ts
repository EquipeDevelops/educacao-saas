import { Router } from "express";
import { relatoriosController } from "./relatorios.controller";
import { protect, authorize } from "../../middlewares/auth";

const router = Router();

router.get(
  "/boletim",
  protect,
  authorize("GESTOR"),
  relatoriosController.getBoletimPorTurma
);

router.get(
  "/frequencia-detalhada",
  protect,
  authorize("GESTOR"),
  relatoriosController.getFrequenciaDetalhadaPorTurma
);

export { router as relatoriosRoutes };
