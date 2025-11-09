import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { alunoDashboardService } from "./alunoDashboard.service";

export const alunoDashboardController = {
  getDashboardData: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dashboardData = await alunoDashboardService.getDashboardData(req.user);
      res.status(200).json(dashboardData);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao buscar os dados do dashboard do aluno.",
        error: error.message,
      });
    }
  },
};