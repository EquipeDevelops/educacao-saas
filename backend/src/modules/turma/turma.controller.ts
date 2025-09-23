import { Response } from "express";
import { turmaService } from "./turma.service";
import { CreateTurmaInput } from "./turma.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const turmaController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res.status(403).json({
          message: "Apenas gestores de uma unidade escolar podem criar turmas.",
        });
      }
      const turma = await turmaService.create(
        req.body as CreateTurmaInput,
        unidadeEscolarId
      );
      return res.status(201).json(turma);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao criar turma.", error: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res.status(200).json([]);
      }
      const turmas = await turmaService.findAll(unidadeEscolarId);
      return res.status(200).json(turmas);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar turmas." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res.status(404).json({ message: "Turma não encontrada." });
      }
      const turma = await turmaService.findById(id, unidadeEscolarId);
      if (!turma) {
        return res.status(404).json({
          message:
            "Turma não encontrada ou não pertence a esta unidade escolar.",
        });
      }
      return res.status(200).json(turma);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar turma." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res
          .status(404)
          .json({ message: "Turma não encontrada para atualizar." });
      }
      const result = await turmaService.update(
        id,
        req.body as any,
        unidadeEscolarId
      );
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Turma não encontrada para atualizar." });
      return res.status(200).json({ message: "Turma atualizada com sucesso." });
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao atualizar turma." });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res
          .status(404)
          .json({ message: "Turma não encontrada para deletar." });
      }
      const result = await turmaService.remove(id, unidadeEscolarId);
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Turma não encontrada para deletar." });
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao deletar turma." });
    }
  },
};
