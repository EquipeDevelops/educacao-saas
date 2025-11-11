import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import {
  getResponsavelAgenda,
  getResponsavelAtividades,
  getResponsavelBoletim,
  getResponsavelDashboard,
} from "./responsavelDashboard.service";

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
  async boletim(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { alunoId } = req.query as { alunoId?: string };

      const data = await getResponsavelBoletim(authReq.user, { alunoId });

      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(400).json({
        message:
          error?.message ||
          "Não foi possível carregar o boletim do aluno selecionado.",
      });
    }
  },
  async agenda(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { alunoId, start, end } = req.query as {
        alunoId?: string;
        start?: string;
        end?: string;
      };

      const parseDate = (value?: string) => {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const today = new Date();
      const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const startDate = parseDate(start) ?? defaultStart;
      const endDate = parseDate(end) ?? defaultEnd;

      if (startDate > endDate) {
        return res.status(400).json({
          message: "A data inicial não pode ser maior que a data final.",
        });
      }

      const data = await getResponsavelAgenda(authReq.user, {
        alunoId,
        startDate,
        endDate,
      });

      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(400).json({
        message:
          error?.message ||
          "Não foi possível carregar a agenda do aluno selecionado.",
      });
    }
  },
  async atividades(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { alunoId } = req.query as { alunoId?: string };

      const data = await getResponsavelAtividades(authReq.user, { alunoId });

      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(400).json({
        message:
          error?.message ||
          "Não foi possível carregar as atividades do aluno selecionado.",
      });
    }
  },
};
