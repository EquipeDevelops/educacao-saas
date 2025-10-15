import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth";
import { gestorDashboardController } from "./gestorDashboard.controller";

const router = Router();

router.use(protect, authorize("GESTOR"));

router.get("/stats", gestorDashboardController.getStats);

router.get("/charts", gestorDashboardController.getChartData);

export const gestorDashboardRoutes = router;
