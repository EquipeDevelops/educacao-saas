import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth"; // <-- 1. IMPORTA O TIPO CUSTOMIZADO
import { componenteService } from "./componenteCurricular.service";
import {
  CreateComponenteInput,
  FindAllComponentesInput,
  UpdateComponenteInput,
} from "./componenteCurricular.validator";

export const componenteController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    // <-- 2. USA O TIPO CUSTOMIZADO
    try {
      const { instituicaoId } = req.user;
      const componente = await componenteService.create(
        req.body as CreateComponenteInput,
        instituicaoId!
      );
      return res.status(201).json(componente);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message:
            "Esta matéria já foi atribuída a esta turma neste ano letivo.",
        });
      }
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user;
      const componentes = await componenteService.findAll(
        instituicaoId!,
        req.query as FindAllComponentesInput
      );
      return res.status(200).json(componentes);
    } catch (error: any) {
      return res.status(500).json({
        message: "Erro ao buscar componentes curriculares.",
        error: error.message,
      });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const componente = await componenteService.findById(id, instituicaoId!);
      if (!componente) {
        return res
          .status(404)
          .json({ message: "Componente curricular não encontrado." });
      }
      return res.status(200).json(componente);
    } catch (error: any) {
      return res.status(500).json({
        message: "Erro ao buscar componente curricular.",
        error: error.message,
      });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const componenteAtualizado = await componenteService.update(
        id,
        req.body,
        instituicaoId!
      );
      return res.status(200).json(componenteAtualizado);
    } catch (error: any) {
      if ((error as any).code === "P2025") {
        return res.status(404).json({
          message: "Componente curricular não encontrado para atualização.",
        });
      }
      return res.status(500).json({
        message: "Erro ao atualizar componente curricular.",
        error: error.message,
      });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      await componenteService.remove(id, instituicaoId!);
      return res.status(204).send();
    } catch (error: any) {
      if ((error as any).code === "P2025") {
        return res.status(404).json({
          message: "Componente curricular não encontrado para exclusão.",
        });
      }
      return res.status(500).json({
        message: "Erro ao deletar componente curricular.",
        error: error.message,
      });
    }
  },
};
