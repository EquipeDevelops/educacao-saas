import { Request, Response } from "express";
import { topicoService } from "./topicoForum.service";
import {
  CreateTopicoInput,
  UpdateTopicoInput,
  TopicoParams,
} from "./topicoForum.validator";

export const topicoController = {
  create: async (req: Request<{}, {}, CreateTopicoInput>, res: Response) => {
    try {
      const novoTopico = await topicoService.create(req.body);
      return res.status(201).json(novoTopico);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const { instituicaoId } = req.query;
      if (!instituicaoId) {
        return res
          .status(400)
          .json({ message: "O ID da instituição é obrigatório." });
      }
      const topicos = await topicoService.findAllByInstituicao(
        instituicaoId as string
      );
      return res.status(200).json(topicos);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar tópicos." });
    }
  },

  findById: async (req: Request<TopicoParams>, res: Response) => {
    try {
      const topico = await topicoService.findById(req.params.id);
      if (!topico) {
        return res.status(404).json({ message: "Tópico não encontrado." });
      }
      return res.status(200).json(topico);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar tópico." });
    }
  },

  update: async (
    req: Request<TopicoParams, {}, UpdateTopicoInput>,
    res: Response
  ) => {
    try {
      const topicoAtualizado = await topicoService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(topicoAtualizado);
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Tópico não encontrado para atualização." });
    }
  },

  delete: async (req: Request<TopicoParams>, res: Response) => {
    try {
      await topicoService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Tópico não encontrado para exclusão." });
    }
  },
};
