import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth";
import { gestorDashboardController } from "./gestorDashboard.controller";

const router = Router();

router.use(protect, authorize("GESTOR"));

router.get("/horarios", gestorDashboardController.getHorarios);
router.get("/eventos", gestorDashboardController.getEventos);

export const gestorDashboardRoutes = router;
