// equipedevelops/educacao-saas/educacao-saas-main/backend/src/modules/alunoDashboard/alunoDashboard.routes.ts
import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth";
import { alunoDashboardController } from "./alunoDashboard.controller";

const router = Router();

// Protege todas as rotas para garantir que apenas alunos autenticados acessem
router.use(protect, authorize("ALUNO"));

// Rota única para buscar todos os dados do dashboard
router.get("/", alunoDashboardController.getDashboardData);

export const alunoDashboardRoutes = router;