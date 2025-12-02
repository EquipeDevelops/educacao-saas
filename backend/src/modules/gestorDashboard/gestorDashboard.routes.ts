import { Router } from "express";
import { gestorDashboardController } from "./gestorDashboard.controller";
import { authorize } from "../../middlewares/auth";

const router = Router();

router.use(authorize("GESTOR", "ADMINISTRADOR"));

router.get("/stats", gestorDashboardController.getStats);
router.get("/performance", gestorDashboardController.getPerformance);
router.get("/attendance", gestorDashboardController.getAttendance);

export { router as gestorDashboardRoutes };
