import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth";
import { PapelUsuario } from "@prisma/client";
import { responsavelDashboardController } from "./responsavelDashboard.controller";

const router = Router();

router.use(protect, authorize(PapelUsuario.RESPONSAVEL));
router.get("/", responsavelDashboardController.index);
router.get("/boletim", responsavelDashboardController.boletim);
router.get("/agenda", responsavelDashboardController.agenda);
router.get("/atividades", responsavelDashboardController.atividades);

export { router as responsavelDashboardRoutes };
