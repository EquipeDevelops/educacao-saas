import { Request, Response } from "express";
import { questaoService } from "./questao.service";
import {
  CreateQuestaoInput,
  UpdateQuestaoInput,
  QuestaoParams,
} from "./questao.validator";

export const questaoController = {
  create: async (req: Request<{}, {}, CreateQuestaoInput>, res: Response) => {
    try {
      const novaQuestao = await questaoService.create(req.body);
      return res.status(201).json(novaQuestao);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const { tarefaId } = req.query;

      if (!tarefaId) {
        return res.status(400).json({
          message: "O ID da tarefa é obrigatório para listar as questões.",
        });
      }

      const questoes = await questaoService.findAllByTarefa(tarefaId as string);
      return res.status(200).json(questoes);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar questões." });
    }
  },

  findById: async (req: Request<QuestaoParams>, res: Response) => {
    try {
      const questao = await questaoService.findById(req.params.id);
      if (!questao) {
        return res.status(404).json({ message: "Questão não encontrada." });
      }
      return res.status(200).json(questao);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar questão." });
    }
  },

  update: async (
    req: Request<QuestaoParams, {}, UpdateQuestaoInput>,
    res: Response
  ) => {
    try {
      const questaoAtualizada = await questaoService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(questaoAtualizada);
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Questão não encontrada para atualização." });
    }
  },

  delete: async (req: Request<QuestaoParams>, res: Response) => {
    try {
      await questaoService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Questão não encontrada para exclusão." });
    }
  },
};
