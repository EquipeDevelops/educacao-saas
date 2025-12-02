import { Request, Response, NextFunction } from "express";
import { gestorDashboardService } from "./gestorDashboard.service";
import { RequestWithPrisma } from "../../middlewares/prisma-context";

export const gestorDashboardController = {
  getStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as RequestWithPrisma;
      const { unidadeEscolarId } = authReq.user;

      if (!unidadeEscolarId) {
        return res
          .status(400)
          .json({ message: "Usuário não vinculado a uma unidade escolar." });
      }

      const stats = await gestorDashboardService.getStats(
        unidadeEscolarId,
        authReq.prismaWithAudit
      );

      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },

  getPerformance: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as RequestWithPrisma;
      const { unidadeEscolarId } = authReq.user;

      const data = await gestorDashboardService.getPerformance(
        unidadeEscolarId!,
        authReq.prismaWithAudit
      );
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  getAttendance: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as RequestWithPrisma;
      const { unidadeEscolarId } = authReq.user;

      const data = await gestorDashboardService.getAttendance(
        unidadeEscolarId!,
        authReq.prismaWithAudit
      );
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};
