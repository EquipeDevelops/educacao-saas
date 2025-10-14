import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { gestorDashboardService } from "./gestorDashboard.service";

export const gestorDashboardController = {
  getHorarios: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const horarios = await gestorDashboardService.getHorarios(req.user);
      res.status(200).json(horarios);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao buscar horários.",
        error: error.message,
      });
    }
  },
  getEventos: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const eventos = await gestorDashboardService.getEventos(req.user);
      res.status(200).json(eventos);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao buscar eventos.",
        error: error.message,
      });
    }
  },
};
