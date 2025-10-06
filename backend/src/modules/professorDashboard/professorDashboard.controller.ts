import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { professorDashboardService } from "./professorDashboard.service";

export const professorDashboardController = {
  getMyStudents: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const students = await professorDashboardService.getMyStudents(req.user);
      res.status(200).json(students);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao buscar alunos do professor.",
        error: error.message,
      });
    }
  },

  getColleagues: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const colleagues = await professorDashboardService.getColleagues(
        req.user
      );
      res.status(200).json(colleagues);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao buscar colegas professores.",
        error: error.message,
      });
    }
  },

  getHeaderInfo: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const info = await professorDashboardService.getHeaderInfo(req.user);
      res.status(200).json(info);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao buscar informações do cabeçalho.",
        error: error.message,
      });
    }
  },

  getHomeStats: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await professorDashboardService.getHomeStats(req.user);
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao buscar estatísticas da home.",
        error: error.message,
      });
    }
  },

  getAtividadesPendentes: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await professorDashboardService.getAtividadesPendentes(
        req.user
      );
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao buscar atividades pendentes.",
        error: error.message,
      });
    }
  },

  getDesempenhoTurmas: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await professorDashboardService.getDesempenhoTurmas(
        req.user
      );
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao buscar desempenho das turmas.",
        error: error.message,
      });
    }
  },

  getTurmas: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const turmasData = await professorDashboardService.getTurmasDashboard(
        req.user
      );
      res.status(200).json(turmasData);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao buscar dados das turmas.",
        error: error.message,
      });
    }
  },

  getCorrecoes: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const correcoesData =
        await professorDashboardService.getCorrecoesDashboard(req.user);
      res.status(200).json(correcoesData);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao buscar dados de correções.",
        error: error.message,
      });
    }
  },

  getTurmaDetails: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { componenteId } = req.params;
      const details = await professorDashboardService.getTurmaDetails(
        componenteId,
        req.user
      );
      res.status(200).json(details);
    } catch (error: any) {
      if ((error as any).name === "NotFoundError") {
        return res
          .status(404)
          .json({ message: "Turma ou componente não encontrado." });
      }
      res.status(500).json({
        message: "Erro ao buscar detalhes da turma.",
        error: error.message,
      });
    }
  },
};
