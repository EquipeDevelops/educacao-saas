import { Request, Response, NextFunction } from "express";
import { alunoService } from "./aluno.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const alunoController = {
  findAll: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res.status(403).json({
          message: "Usuário não está associado a uma unidade escolar.",
        });
      }
      const alunos = await alunoService.findAllPerfis(unidadeEscolarId);
      res.json(alunos);
    } catch (error) {
      next(error);
    }
  },

  findOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // ID do USUÁRIO
      const aluno = await alunoService.findOne(id);
      if (!aluno) {
        return res.status(404).json({ message: "Aluno não encontrado." });
      }
      res.json(aluno);
    } catch (error) {
      next(error);
    }
  },

  getBoletim: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params; // ID do USUÁRIO do aluno
      console.log(`[CONTROLLER] Requisição para boletim do usuário ID: ${id}`);
      const boletimData = await alunoService.getBoletim(id);
      res.json(boletimData);
    } catch (error) {
      next(error);
    }
  },
};
