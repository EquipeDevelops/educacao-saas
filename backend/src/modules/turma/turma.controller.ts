import { Request, Response } from "express";
import { turmaService } from "./turma.service";
import {
  CreateTurmaInput,
  UpdateTurmaInput,
  TurmaParams,
} from "./turma.validator";

export const turmaController = {
  create: async (req: Request<{}, {}, CreateTurmaInput>, res: Response) => {
    try {
      const novaTurma = await turmaService.create(req.body);
      return res.status(201).json(novaTurma);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const { instituicaoId, unidadeEscolarId, professorId } = req.query;
      const filters = {
        instituicaoId: instituicaoId as string | undefined,
        unidadeEscolarId: unidadeEscolarId as string | undefined,
        professorId: professorId as string | undefined,
      };

      const turmas = await turmaService.findAll(filters);
      return res.status(200).json(turmas);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar turmas." });
    }
  },

  findById: async (req: Request<TurmaParams>, res: Response) => {
    try {
      const turma = await turmaService.findById(req.params.id);
      if (!turma) {
        return res.status(404).json({ message: "Turma não encontrada." });
      }
      return res.status(200).json(turma);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar turma." });
    }
  },

  update: async (
    req: Request<TurmaParams, {}, UpdateTurmaInput>,
    res: Response
  ) => {
    try {
      const turmaAtualizada = await turmaService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(turmaAtualizada);
    } catch (error: any) {
      if (error.message === "Turma não encontrada.") {
        return res.status(404).json({ message: error.message });
      }
      return res.status(400).json({ message: error.message });
    }
  },

  delete: async (req: Request<TurmaParams>, res: Response) => {
    try {
      await turmaService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Turma não encontrada para exclusão." });
    }
  },
};
