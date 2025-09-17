import { Response } from "express";
import { materiaService } from "./materia.service";
import { AuthenticatedRequest } from "../../middlewares/auth"; // <-- 1. IMPORTA O TIPO

export const materiaController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user; // <-- 2. USA O DADO REAL E SEGURO
      const materia = await materiaService.create(req.body, instituicaoId!);
      return res.status(201).json(materia);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Já existe uma matéria com este nome na instituição.",
        });
      }
      return res
        .status(500)
        .json({ message: "Erro ao criar matéria.", error: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user;
      const materias = await materiaService.findAll(instituicaoId!);
      return res.status(200).json(materias);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar matérias.", error: error.message });
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
      return res
        .status(500)
        .json({ message: "Erro ao buscar matéria.", error: error.message });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const result = await materiaService.update(id, req.body, instituicaoId!);
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Matéria não encontrada para atualizar." });
      return res
        .status(200)
        .json({ message: "Matéria atualizada com sucesso." });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao atualizar matéria.", error: error.message });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const result = await materiaService.remove(id, instituicaoId!);
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Matéria não encontrada para deletar." });
      return res.status(204).send();
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao deletar matéria.", error: error.message });
    }
  },
};
