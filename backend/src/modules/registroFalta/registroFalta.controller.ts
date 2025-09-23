// Caminho: backend/src/modules/registroFalta/registroFalta.controller.ts
import { Response } from "express";
import { registroFaltaService } from "./registroFalta.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { FindAllFaltasInput } from "./registroFalta.validator";

export const registroFaltaController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const falta = await registroFaltaService.create(req.body, req.user);
      return res.status(201).json(falta);
    } catch (error: any) {
      if (error.message.includes("Já existe um registro"))
        return res.status(409).json({ message: error.message });
      return res.status(403).json({ message: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const faltas = await registroFaltaService.findAll(
        req.user,
        req.query as FindAllFaltasInput
      );
      return res.status(200).json(faltas);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar faltas." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const falta = await registroFaltaService.findById(
        req.params.id,
        req.user
      );
      if (!falta)
        return res
          .status(404)
          .json({ message: "Registro de falta não encontrado." });
      return res.status(200).json(falta);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar registro de falta." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const falta = await registroFaltaService.update(
        req.params.id,
        req.body,
        req.user
      );
      return res.status(200).json(falta);
    } catch (error: any) {
      if ((error as any).code === "P2025")
        return res.status(404).json({ message: error.message });
      return res.status(403).json({ message: error.message });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      await registroFaltaService.remove(req.params.id, req.user);
      return res.status(204).send();
    } catch (error: any) {
      if ((error as any).code === "P2025")
        return res.status(404).json({ message: error.message });
      return res.status(403).json({ message: error.message });
    }
  },
};
