import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { gestorDashboardService } from "./gestorDashboard.service";
import { PeriodoAvaliacao } from "@prisma/client";

export const gestorDashboardController = {
  getHorarios: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const horarios = await gestorDashboardService.getHorarios(authReq.user);
      res.json(horarios);
    } catch (error) {
      next(error);
    }
  },
  getEventos: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const eventos = await gestorDashboardService.getEventos(authReq.user);
      res.json(eventos);
    } catch (error) {
      next(error);
    }
  },

  getStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const stats = await gestorDashboardService.getStats(authReq.user);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  getChartData: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      const periodo = req.query.periodo as PeriodoAvaliacao | undefined;

      const chartData = await gestorDashboardService.getChartData(
        authReq.user,
        { ano, periodo }
      );
      res.json(chartData);
    } catch (error) {
      next(error);
    }
  },

  getDesempenhoPorMateria: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { turmaId } = req.params;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      const periodo = req.query.periodo as PeriodoAvaliacao | undefined;

      const chartData = await gestorDashboardService.getDesempenhoPorMateria(
        authReq.user,
        turmaId,
        { ano, periodo }
      );
      res.json(chartData);
    } catch (error) {
      next(error);
    }
  },
};
