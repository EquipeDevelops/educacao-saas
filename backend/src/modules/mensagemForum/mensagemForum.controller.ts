import { Request, Response } from "express";
import { mensagemService } from "./mensagemForum.service";
import { CreateMensagemInput } from "./mensagemForum.validator";

export const mensagemController = {
  create: async (
    req: Request<{ topicoId: string }, {}, CreateMensagemInput>,
    res: Response
  ) => {
    try {
      const novaMensagem = await mensagemService.create(
        req.params.topicoId,
        req.body
      );
      return res.status(201).json(novaMensagem);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  findAllByTopico: async (
    req: Request<{ topicoId: string }>,
    res: Response
  ) => {
    try {
      const mensagens = await mensagemService.findAllByTopico(
        req.params.topicoId
      );
      return res.status(200).json(mensagens);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar mensagens." });
    }
  },
};
