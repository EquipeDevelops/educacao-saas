import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { relatoriosService } from "./relatorios.service";
import { PeriodoAvaliacao } from "@prisma/client";

export const relatoriosController = {
  getBoletimPorTurma: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { turmaId, periodo, ano } = req.query;

      if (!turmaId || !periodo || !ano) {
        return res.status(400).json({
          message: "Os filtros turmaId, periodo e ano são obrigatórios.",
        });
      }

      const boletins = await relatoriosService.getBoletimPorTurma(
        authReq.user,
        {
          turmaId: String(turmaId),
          periodo: periodo as PeriodoAvaliacao,
          ano: parseInt(String(ano)),
        }
      );

      res.json(boletins);
    } catch (error) {
      next(error);
    }
  },

  getFrequenciaDetalhadaPorTurma: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { turmaId, dataInicio, dataFim } = req.query;

      if (!turmaId || !dataInicio || !dataFim) {
        return res.status(400).json({
          message: "Os filtros turmaId, dataInicio e dataFim são obrigatórios.",
        });
      }

      const relatorio = await relatoriosService.getFrequenciaDetalhadaPorTurma(
        authReq.user,
        {
          turmaId: String(turmaId),
          dataInicio: new Date(String(dataInicio)),
          dataFim: new Date(String(dataFim)),
        }
      );

      res.json(relatorio);
    } catch (error) {
      next(error);
    }
  },
};
