// Caminho: backend/src/modules/questao/questao.controller.ts
import { Response } from "express";
import { questaoService } from "./questao.service";
import {
  CreateQuestaoInput,
  FindAllQuestoesInput,
  UpdateQuestaoInput,
} from "./questao.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const questaoController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const questao = await questaoService.create(
        req.body as CreateQuestaoInput,
        req.user
      );
      return res.status(201).json(questao);
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      return res.status(500).json({ message: "Erro ao criar questão." });
    }
  },
  findAllByTarefa: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const questoes = await questaoService.findAllByTarefa(
        req.query as FindAllQuestoesInput,
        req.user
      );
      return res.status(200).json(questoes);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  },
  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const questao = await questaoService.findById(req.params.id, req.user);
      if (!questao)
        return res.status(404).json({ message: "Questão não encontrada." });
      return res.status(200).json(questao);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar questão." });
    }
  },
  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const questao = await questaoService.update(
        req.params.id,
        req.body as UpdateQuestaoInput["body"],
        req.user
      );
      return res.status(200).json(questao);
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if (error.code === "P2025")
        return res.status(404).json({ message: "Questão não encontrada." });
      return res.status(500).json({ message: "Erro ao atualizar questão." });
    }
  },
  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      await questaoService.remove(req.params.id, req.user);
      return res.status(204).send();
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if (error.code === "P2025")
        return res.status(404).json({ message: "Questão não encontrada." });
      return res.status(500).json({ message: "Erro ao deletar questão." });
    }
  },
};
