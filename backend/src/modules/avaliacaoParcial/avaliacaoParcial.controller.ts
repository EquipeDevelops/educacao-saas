import { Response } from "express";
import { avaliacaoService } from "./avaliacaoParcial.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import {
  FindAllAvaliacoesInput,
  CreateAvaliacaoInput,
} from "./avaliacaoParcial.validator";

export const avaliacaoController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const avaliacao = await avaliacaoService.create(
        req.body as CreateAvaliacaoInput,
        req.user
      );
      return res.status(201).json(avaliacao);
    } catch (error: any) {
      return res.status(403).json({ message: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const avaliacoes = await avaliacaoService.findAll(
        req.user,
        req.query as FindAllAvaliacoesInput
      );
      return res.status(200).json(avaliacoes);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar avaliações." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const avaliacao = await avaliacaoService.findById(
        req.params.id,
        req.user
      );
      if (!avaliacao)
        return res.status(404).json({ message: "Avaliação não encontrada." });
      return res.status(200).json(avaliacao);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar avaliação." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const avaliacao = await avaliacaoService.update(
        req.params.id,
        req.body,
        req.user
      );
      return res.status(200).json(avaliacao);
    } catch (error: any) {
      if ((error as any).code === "P2025")
        return res.status(404).json({ message: error.message });
      return res.status(403).json({ message: error.message });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      await avaliacaoService.remove(req.params.id, req.user);
      return res.status(204).send();
    } catch (error: any) {
      if ((error as any).code === "P2025")
        return res.status(404).json({ message: error.message });
      return res.status(403).json({ message: error.message });
    }
  },
};
