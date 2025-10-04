import { Response } from "express";
import { materiaService } from "./materia.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const materiaController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res.status(403).json({
          message: "Apenas gestores de colégio podem criar matérias.",
        });
      }
      const materia = await materiaService.create(req.body, unidadeEscolarId);
      return res.status(201).json(materia);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Já existe uma matéria com este nome neste colégio.",
        });
      }
      return res.status(500).json({ message: "Erro ao criar matéria." });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res
          .status(403)
          .json({ message: "Usuário não vinculado a um colégio." });
      }
      const materias = await materiaService.findAll(unidadeEscolarId);
      return res.status(200).json(materias);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar matérias." });
    }
  },
  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const materia = await materiaService.findById(id, instituicaoId!);
      if (!materia) {
        return res.status(404).json({ message: "Matéria não encontrada." });
      }
      return res.status(200).json(materia);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar matéria." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId} = req.user;
      const result = await materiaService.update(id, req.body, unidadeEscolarId!);
      if (result.count === 0) {
        return res
          .status(404)
          .json({ message: "Matéria não encontrada para atualizar." });
      }
      return res
        .status(200)
        .json({ message: "Matéria atualizada com sucesso." });
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao atualizar matéria." });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      const result = await materiaService.remove(id,unidadeEscolarId!);
      if (result.count === 0) {
        return res
          .status(404)
          .json({ message: "Matéria não encontrada para deletar." });
      }
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao deletar matéria." ,error: error.message});
    }
  },
};
