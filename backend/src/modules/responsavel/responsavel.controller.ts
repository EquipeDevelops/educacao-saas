import { Request, Response, NextFunction } from "express";
import { responsavelService } from "./responsavel.service";
import { RequestWithPrisma } from "../../middlewares/prisma-context";

export const responsavelController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as RequestWithPrisma;
      const unidadeEscolarId = authReq.user.unidadeEscolarId;

      if (!unidadeEscolarId) {
        return res.status(400).json({
          message:
            "Gestor não está vinculado a uma unidade escolar para listar responsáveis.",
        });
      }

      const responsaveis = await responsavelService.listResponsaveis(
        unidadeEscolarId,
        authReq.prismaWithAudit
      );

      res.status(200).json(responsaveis);
    } catch (error) {
      next(error);
    }
  },

  vincularAluno: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as RequestWithPrisma;
      const unidadeEscolarId = authReq.user.unidadeEscolarId;
      const { responsavelId } = req.params;
      const { alunoId, parentesco, principal } = req.body;

      if (!unidadeEscolarId) {
        return res.status(400).json({
          message:
            "Gestor não está vinculado a uma unidade escolar para criar vínculos.",
        });
      }

      const responsavelAtualizado = await responsavelService.vincularAluno(
        {
          unidadeEscolarId,
          responsavelId,
          alunoId,
          parentesco,
          principal,
        },
        authReq.prismaWithAudit
      );

      res.status(201).json(responsavelAtualizado);
    } catch (error) {
      next(error);
    }
  },

  desvincularAluno: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authReq = req as RequestWithPrisma;
      const unidadeEscolarId = authReq.user.unidadeEscolarId;
      const { responsavelId, alunoId } = req.params;

      if (!unidadeEscolarId) {
        return res.status(400).json({
          message:
            "Gestor não está vinculado a uma unidade escolar para remover vínculos.",
        });
      }

      const responsavelAtualizado = await responsavelService.desvincularAluno(
        {
          unidadeEscolarId,
          responsavelId,
          alunoId,
        },
        authReq.prismaWithAudit
      );

      res.status(200).json(responsavelAtualizado);
    } catch (error) {
      next(error);
    }
  },
};
