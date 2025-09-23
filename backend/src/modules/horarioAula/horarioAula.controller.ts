import { Response } from "express";
import { horarioService } from "./horarioAula.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { FindAllHorariosInput } from "./horarioAula.validator";

export const horarioController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res
          .status(403)
          .json({ message: "Usuário não vinculado a um colégio." });
      }
      const horario = await horarioService.create(req.body, unidadeEscolarId);
      return res.status(201).json(horario);
    } catch (error: any) {
      if (error.message.includes("Conflito de horário")) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const horarios = await horarioService.findAll(
        req.user,
        req.query as FindAllHorariosInput
      );
      return res.status(200).json(horarios);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar horários." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId)
        return res.status(404).json({ message: "Horário não encontrado." });

      const horario = await horarioService.findById(id, unidadeEscolarId);
      if (!horario)
        return res.status(404).json({ message: "Horário não encontrado." });

      return res.status(200).json(horario);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar horário." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId)
        return res.status(403).json({ message: "Ação não permitida." });

      const horario = await horarioService.update(
        id,
        req.body,
        unidadeEscolarId
      );
      return res.status(200).json(horario);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId)
        return res.status(403).json({ message: "Ação não permitida." });

      await horarioService.remove(id, unidadeEscolarId);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  },
};
