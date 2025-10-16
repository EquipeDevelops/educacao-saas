import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth";
import { professorDashboardController } from "./professorDashboard.controller";

const router = Router();

router.use(protect, authorize("PROFESSOR"));

router.get("/header-info", professorDashboardController.getHeaderInfo);

router.get("/my-students", professorDashboardController.getMyStudents);
router.get("/colleagues", professorDashboardController.getColleagues);

router.get("/home-stats", professorDashboardController.getHomeStats);

router.get(
  "/atividades-pendentes",
  professorDashboardController.getAtividadesPendentes
);

router.get(
  "/desempenho-turmas",
  professorDashboardController.getDesempenhoTurmas
);

router.get("/turmas", professorDashboardController.getTurmas);

router.get(
  "/turmas/:componenteId/details",
  professorDashboardController.getTurmaDetails
);

router.get("/correcoes", professorDashboardController.getCorrecoes);

export const professorDashboardRoutes = router;
