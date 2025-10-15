import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { gestorDashboardService } from "./gestorDashboard.service";

export const gestorDashboardController = {
  /**
   * Controller para buscar estatísticas gerais do dashboard.
   */
  getStats: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await gestorDashboardService.getStats(req.user);
      res.status(200).json(stats);
    } catch (error: any) {
      console.error("[CONTROLLER ERROR] getStats:", error);
      res.status(500).json({
        message: "Erro ao buscar estatísticas do dashboard.",
        error: error.message,
      });
    }
  },

  /**
   * Controller para buscar dados dos gráficos do dashboard.
   */
  getChartData: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const chartData = await gestorDashboardService.getChartData(req.user);
      res.status(200).json(chartData);
    } catch (error: any) {
      console.error("[CONTROLLER ERROR] getChartData:", error);
      res.status(500).json({
        message: "Erro ao buscar dados para os gráficos.",
        error: error.message,
      });
    }
  },
};
