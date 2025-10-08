import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { superAdminService } from "./superadmin.service";

export const superAdminController = {
  getDashboardStats: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await superAdminService.getDashboardStats();
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar estatísticas." });
    }
  },

  findAllInstituicoes: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const instituicoes = await superAdminService.findAllInstituicoes();
      res.status(200).json(instituicoes);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar instituições." });
    }
  },
};
