import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { componenteService } from "./componenteCurricular.service";
import {
  CreateComponenteInput,
  FindAllComponentesInput,
} from "./componenteCurricular.validator";

export const componenteController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const componente = await componenteService.create(
        req.body as CreateComponenteInput,
        req.user // Passa o usuário logado inteiro para o serviço
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
      const componentes = await componenteService.findAll(
        req.user,
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
      const componente = await componenteService.findById(id, req.user);
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
      const componenteAtualizado = await componenteService.update(
        id,
        req.body,
        req.user
      );
      return res.status(200).json(componenteAtualizado);
    } catch (error: any) {
      return res.status(403).json({ message: error.message });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      await componenteService.remove(id, req.user);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(403).json({ message: error.message });
    }
  },
};
