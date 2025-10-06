import { Response } from "express";
import { mensagemService } from "./mensagem.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { CreateMensagemInput } from "./mensagem.validator";

export const mensagemController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conversaId } = req.params;
      const { conteudo } = req.body as CreateMensagemInput;
      const user = req.user;

      const mensagem = await mensagemService.create(conversaId, conteudo, user);
      return res.status(201).json(mensagem);
    } catch (error: any) {
      return res.status(403).json({ message: error.message });
    }
  },
};
