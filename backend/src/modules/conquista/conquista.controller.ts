import { Response } from "express";
import { conquistaService } from "./conquista.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const conquistaController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user;
      const conquista = await conquistaService.create(req.body, instituicaoId!);
      return res.status(201).json(conquista);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ message: "Já existe uma conquista com este código." });
      }
      return res.status(500).json({ message: "Erro ao criar conquista." });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user;
      const conquistas = await conquistaService.findAll(instituicaoId!);
      return res.status(200).json(conquistas);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar conquistas." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const conquista = await conquistaService.findById(id, instituicaoId!);
      if (!conquista)
        return res.status(404).json({ message: "Conquista não encontrada." });
      return res.status(200).json(conquista);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar conquista." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const result = await conquistaService.update(
        id,
        req.body,
        instituicaoId!
      );
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Conquista não encontrada para atualizar." });
      return res
        .status(200)
        .json({ message: "Conquista atualizada com sucesso." });
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao atualizar conquista." });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const result = await conquistaService.remove(id, instituicaoId!);
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Conquista não encontrada para deletar." });
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao deletar conquista." });
    }
  },
};
