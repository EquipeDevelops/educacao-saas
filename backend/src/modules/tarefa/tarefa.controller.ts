import { Response } from "express";
import type { Express } from "express";
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
      // A lógica de permissão agora está toda no serviço.
      // O controller apenas passa os dados necessários.
      const tarefa = await tarefaService.create(req.body, req.user);
      return res.status(201).json(tarefa);
    } catch (error: any) {
      if ((error as any).code === "FORBIDDEN") {
        return res.status(403).json({ message: error.message });
      }
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
      const tarefa = await tarefaService.update(
        id,
        req.body as UpdateTarefaInput["body"],
        req.user
      );
      return res.status(200).json(tarefa);
    } catch (error: any) {
      if ((error as any).code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if ((error as any).code === "P2025")
        return res.status(404).json({ message: "Tarefa não encontrada." });
      return res.status(500).json({ message: "Erro ao atualizar tarefa." });
    }
  },

  publish: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { publicado } = req.body as PublishTarefaInput["body"];
      const tarefa = await tarefaService.publish(id, publicado, req.user);
      return res.status(200).json(tarefa);
    } catch (error: any) {
      if ((error as any).code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if ((error as any).code === "P2025")
        return res.status(404).json({ message: "Tarefa não encontrada." });
      return res.status(500).json({ message: "Erro ao publicar tarefa." });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      await tarefaService.remove(id, req.user);
      return res.status(204).send();
    } catch (error: any) {
      if ((error as any).code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if ((error as any).code === "P2025")
        return res.status(404).json({ message: "Tarefa não encontrada." });
      return res.status(500).json({ message: "Erro ao deletar tarefa." });
    }
  },

  uploadAttachments: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const files = (req.files as Express.Multer.File[]) ?? [];

      if (!files.length) {
        return res
          .status(400)
          .json({ message: "Envie ao menos um arquivo para anexar." });
      }

      const anexos = await tarefaService.addAttachments(id, files, req.user);
      return res.status(201).json({ anexos });
    } catch (error: any) {
      if ((error as any).code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if ((error as any).code === "P2025")
        return res.status(404).json({ message: "Tarefa não encontrada." });

      if (error instanceof Error && error.message.includes("anexo")) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({
        message: error.message || "Erro ao anexar arquivos ao trabalho.",
      });
    }
  },
};
