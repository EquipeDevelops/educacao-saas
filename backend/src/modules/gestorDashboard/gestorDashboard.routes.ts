import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth";
import { gestorDashboardController } from "./gestorDashboard.controller";

const router = Router();

router.use(protect, authorize("GESTOR"));

router.get("/stats", gestorDashboardController.getStats);

router.get("/charts", gestorDashboardController.getChartData);

router.get(
  "/charts/desempenho-turma/:turmaId",
  gestorDashboardController.getDesempenhoPorMateria
);

export const gestorDashboardRoutes = router;
