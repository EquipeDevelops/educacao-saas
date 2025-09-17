import { Response } from "express";
import { questaoService } from "./questao.service";
import { CreateQuestaoInput, UpdateQuestaoInput } from "./questao.validator";
import { AuthenticatedRequest } from "../../middlewares/auth"; // <-- IMPORTA O TIPO

export const questaoController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId, perfilId: professorId } = req.user;
      const questao = await questaoService.create(
        req.body as CreateQuestaoInput,
        professorId!,
        instituicaoId!
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
      const { instituicaoId } = req.user;
      const questoes = await questaoService.findAllByTarefa(
        req.query as any,
        instituicaoId!
      );
      return res.status(200).json(questoes);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const questao = await questaoService.findById(id, instituicaoId!);
      if (!questao)
        return res.status(404).json({ message: "Questão não encontrada." });
      return res.status(200).json(questao);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar questão." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId, perfilId: professorId } = req.user;
      const questao = await questaoService.update(
        id,
        req.body as UpdateQuestaoInput["body"],
        professorId!,
        instituicaoId!
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
      const { id } = req.params;
      const { instituicaoId, perfilId: professorId } = req.user;
      await questaoService.remove(id, professorId!, instituicaoId!);
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
