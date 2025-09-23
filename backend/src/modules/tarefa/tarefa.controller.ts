import { Response } from "express";
import { tarefaService } from "./tarefa.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import {
  FindAllTarefasInput,
  UpdateTarefaInput,
  PublishTarefaInput,
} from "./tarefa.validator";

export const tarefaController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unidadeEscolarId, perfilId: professorId } = req.user;
      const tarefa = await tarefaService.create(
        req.body,
        professorId!,
        unidadeEscolarId!
      );
      return res.status(201).json(tarefa);
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      return res.status(500).json({ message: "Erro ao criar tarefa." });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tarefas = await tarefaService.findAll(
        req.user,
        req.query as FindAllTarefasInput
      );
      return res.status(200).json(tarefas);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar tarefas." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tarefa = await tarefaService.findById(id, req.user);
      if (!tarefa) {
        return res.status(404).json({ message: "Tarefa não encontrada." });
      }
      return res.status(200).json(tarefa);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar tarefa." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId, perfilId: professorId } = req.user;
      const tarefa = await tarefaService.update(
        id,
        req.body as UpdateTarefaInput["body"],
        professorId!,
        unidadeEscolarId!
      );
      return res.status(200).json(tarefa);
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if (error.code === "P2025")
        return res.status(404).json({ message: "Tarefa não encontrada." });
      return res.status(500).json({ message: "Erro ao atualizar tarefa." });
    }
  },

  publish: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { publicado } = req.body as PublishTarefaInput["body"];
      const { unidadeEscolarId, perfilId: professorId } = req.user;
      const tarefa = await tarefaService.publish(
        id,
        publicado,
        professorId!,
        unidadeEscolarId!
      );
      return res.status(200).json(tarefa);
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if (error.code === "P2025")
        return res.status(404).json({ message: "Tarefa não encontrada." });
      return res.status(500).json({ message: "Erro ao publicar tarefa." });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId, perfilId: professorId } = req.user;
      await tarefaService.remove(id, professorId!, unidadeEscolarId!);
      return res.status(204).send();
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if (error.code === "P2025")
        return res.status(404).json({ message: "Tarefa não encontrada." });
      return res.status(500).json({ message: "Erro ao deletar tarefa." });
    }
  },
};
