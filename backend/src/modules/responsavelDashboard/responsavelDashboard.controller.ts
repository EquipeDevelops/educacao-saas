import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { getResponsavelDashboard } from "./responsavelDashboard.service";

export const responsavelDashboardController = {
  async index(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { alunoId } = req.query as { alunoId?: string };

      const data = await getResponsavelDashboard(authReq.user, { alunoId });

      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(400).json({
        message:
          error?.message ||
          "Não foi possível carregar as informações do dashboard do responsável.",
      });
    }
  },
};
