import { Response } from "express";
import { mensagemService } from "./mensagem.service";
import { AuthenticatedRequest } from "../../middlewares/auth"; // <-- IMPORTA O TIPO

export const mensagemController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conversaId } = req.params;
      const { conteudo } = req.body;
      const { id: autorId } = req.user; // <-- USA O DADO REAL E SEGURO
      const mensagem = await mensagemService.create(
        conversaId,
        conteudo,
        autorId
      );
      // Aqui, idealmente, você emitiria um evento WebSocket para o outro participante.
      return res.status(201).json(mensagem);
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      return res.status(500).json({ message: "Erro ao enviar mensagem." });
    }
  },

  findAllByConversa: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: usuarioId } = req.user;
      const mensagens = await mensagemService.findAllByConversa(
        req as any,
        usuarioId
      );
      return res.status(200).json(mensagens);
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      return res.status(500).json({ message: "Erro ao buscar mensagens." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { conteudo } = req.body;
      const { id: autorId } = req.user;
      const mensagem = await mensagemService.update(id, conteudo, autorId);
      return res.status(200).json(mensagem);
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if (error.code === "NOT_FOUND")
        return res.status(404).json({ message: error.message });
      return res.status(500).json({ message: "Erro ao atualizar mensagem." });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { id: autorId } = req.user;
      await mensagemService.remove(id, autorId);
      return res.status(204).send();
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if (error.code === "NOT_FOUND")
        return res.status(404).json({ message: error.message });
      return res.status(500).json({ message: "Erro ao deletar mensagem." });
    }
  },
};
