import { Response } from "express";
import { conversaService } from "./conversa.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const conversaController = {
  findOrCreate: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: remetenteId, unidadeEscolarId } = req.user;

      if (!unidadeEscolarId) {
        return res.status(403).json({
          message:
            "Apenas usuários vinculados a uma escola podem iniciar conversas.",
        });
      }

      const conversa = await conversaService.findOrCreate(
        req.body,
        remetenteId,
        unidadeEscolarId
      );
      return res.status(200).json(conversa);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  findAllForUser: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: usuarioId } = req.user;
      const conversas = await conversaService.findAllForUser(usuarioId);
      return res.status(200).json(conversas);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar conversas." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { id: usuarioId } = req.user;
      const conversa = await conversaService.findById(id, usuarioId);
      if (!conversa)
        return res.status(404).json({
          message: "Conversa não encontrada ou acesso não permitido.",
        });
      return res.status(200).json(conversa);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar conversa." });
    }
  },
};
