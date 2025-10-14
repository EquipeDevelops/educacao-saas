import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { eventosService } from "./eventos.service";

export const eventosController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const evento = await eventosService.create(req.body, req.user);
      res.status(201).json(evento);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const eventos = await eventosService.findAll(req.user);
      res.status(200).json(eventos);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar eventos." });
    }
  },

  findAllByMonth: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { mes } = req.query as { mes: string };
      const eventos = await eventosService.findAllByMonth(mes, req.user);
      res.status(200).json(eventos);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar eventos." });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      await eventosService.remove(req.params.id, req.user);
      res.status(204).send();
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  },
  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const eventoAtualizado = await eventosService.update(
        req.params.id,
        req.body,
        req.user
      );
      res.status(200).json(eventoAtualizado);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
};
