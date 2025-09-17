import { Response } from "express";
import { tarefaService } from "./tarefa.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import {
  FindAllTarefasInput,
  PublishTarefaInput,
  UpdateTarefaInput,
} from "./tarefa.validator";

export const tarefaController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId, perfilId: professorId } = req.user;
      const tarefa = await tarefaService.create(
        req.body,
        professorId!,
        instituicaoId!
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
      const { instituicaoId, papel } = req.user;
      let filters = req.query as FindAllTarefasInput;

      if (papel === "ALUNO") {
        filters.publicado = "true";
      }

      const tarefas = await tarefaService.findAll(instituicaoId!, filters);
      return res.status(200).json(tarefas);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar tarefas." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const tarefa = await tarefaService.findById(id, instituicaoId!);
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
      const { instituicaoId, perfilId: professorId } = req.user;
      const tarefa = await tarefaService.update(
        id,
        req.body as UpdateTarefaInput["body"],
        professorId!,
        instituicaoId!
      );
      return res.status(200).json(tarefa);
    } catch (error: any) {
      // <-- CORREÇÃO APLICADA AQUI
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
      const { instituicaoId, perfilId: professorId } = req.user;
      const tarefa = await tarefaService.publish(
        id,
        publicado,
        professorId!,
        instituicaoId!
      );
      return res.status(200).json(tarefa);
    } catch (error: any) {
      // <-- CORREÇÃO APLICADA AQUI
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
      const { instituicaoId, perfilId: professorId } = req.user;
      await tarefaService.remove(id, professorId!, instituicaoId!);
      return res.status(204).send();
    } catch (error: any) {
      // <-- CORREÇÃO APLICADA AQUI
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if (error.code === "P2025")
        return res.status(404).json({ message: "Tarefa não encontrada." });
      return res.status(500).json({ message: "Erro ao deletar tarefa." });
    }
  },
};
