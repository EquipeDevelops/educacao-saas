import { Request, Response } from "express";
import { submissaoService } from "./submissao.service";
import {
  CreateSubmissaoInput,
  GradeSubmissaoInput,
} from "./submissao.validator";

export const submissaoController = {
  create: async (req: Request<{}, {}, CreateSubmissaoInput>, res: Response) => {
    try {
      const novaSubmissao = await submissaoService.create(req.body);
      return res.status(201).json(novaSubmissao);
    } catch (error: any) {
      if (error.message.includes("Já existe uma submissão")) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(400).json({ message: error.message });
    }
  },

  grade: async (
    req: Request<{ id: string }, {}, GradeSubmissaoInput>,
    res: Response
  ) => {
    try {
      const submissaoAvaliada = await submissaoService.grade(
        req.params.id,
        req.body
      );
      return res.status(200).json(submissaoAvaliada);
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Submissão não encontrada para avaliação." });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const { tarefaId, alunoId } = req.query;
      const filters = {
        tarefaId: tarefaId as string | undefined,
        alunoId: alunoId as string | undefined,
      };
      const submissoes = await submissaoService.findAll(filters);
      return res.status(200).json(submissoes);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar submissões." });
    }
  },

  findById: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const submissao = await submissaoService.findById(req.params.id);
      if (!submissao) {
        return res.status(404).json({ message: "Submissão não encontrada." });
      }
      return res.status(200).json(submissao);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar submissão." });
    }
  },
};
