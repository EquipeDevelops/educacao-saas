import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth";
import { PapelUsuario } from "@prisma/client";
import { responsavelDashboardController } from "./responsavelDashboard.controller";

const router = Router();

router.use(protect, authorize(PapelUsuario.RESPONSAVEL));
router.get("/", responsavelDashboardController.index);

export { router as responsavelDashboardRoutes };
