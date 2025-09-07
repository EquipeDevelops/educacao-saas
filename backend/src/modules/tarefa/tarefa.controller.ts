import { Request, Response } from "express";
import { tarefaService } from "./tarefa.service";
import {
  CreateTarefaInput,
  UpdateTarefaInput,
  TarefaParams,
} from "./tarefa.validator";

export const tarefaController = {
  create: async (req: Request<{}, {}, CreateTarefaInput>, res: Response) => {
    try {
      const novaTarefa = await tarefaService.create(req.body);
      return res.status(201).json(novaTarefa);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const { instituicaoId, turmaId, professorId } = req.query;
      const filters = {
        instituicaoId: instituicaoId as string | undefined,
        turmaId: turmaId as string | undefined,
        professorId: professorId as string | undefined,
      };

      const tarefas = await tarefaService.findAll(filters);
      return res.status(200).json(tarefas);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar tarefas." });
    }
  },

  findById: async (req: Request<TarefaParams>, res: Response) => {
    try {
      const tarefa = await tarefaService.findById(req.params.id);
      if (!tarefa) {
        return res.status(404).json({ message: "Tarefa não encontrada." });
      }
      return res.status(200).json(tarefa);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar tarefa." });
    }
  },

  update: async (
    req: Request<TarefaParams, {}, UpdateTarefaInput>,
    res: Response
  ) => {
    try {
      const tarefaAtualizada = await tarefaService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(tarefaAtualizada);
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Tarefa não encontrada para atualização." });
    }
  },

  delete: async (req: Request<TarefaParams>, res: Response) => {
    try {
      await tarefaService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Tarefa não encontrada para exclusão." });
    }
  },
};
