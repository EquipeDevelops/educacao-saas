import { Request, Response } from "express";
import { conquistaService } from "./conquista.service";
import {
  CreateConquistaInput,
  UpdateConquistaInput,
  ConquistaParams,
} from "./conquista.validator";

export const conquistaController = {
  create: async (req: Request<{}, {}, CreateConquistaInput>, res: Response) => {
    try {
      const novaConquista = await conquistaService.create(req.body);
      return res.status(201).json(novaConquista);
    } catch (error: any) {
      if (error.message.includes("Já existe"))
        return res.status(409).json({ message: error.message });
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const { instituicaoId } = req.query;
      if (!instituicaoId)
        return res
          .status(400)
          .json({ message: "O ID da instituição é obrigatório." });
      const conquistas = await conquistaService.findAllByInstituicao(
        instituicaoId as string
      );
      return res.status(200).json(conquistas);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar conquistas." });
    }
  },

  findById: async (req: Request<ConquistaParams>, res: Response) => {
    try {
      const conquista = await conquistaService.findById(req.params.id);
      if (!conquista)
        return res.status(404).json({ message: "Conquista não encontrada." });
      return res.status(200).json(conquista);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar conquista." });
    }
  },

  update: async (
    req: Request<ConquistaParams, {}, UpdateConquistaInput>,
    res: Response
  ) => {
    try {
      const conquistaAtualizada = await conquistaService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(conquistaAtualizada);
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Conquista não encontrada para atualização." });
    }
  },

  delete: async (req: Request<ConquistaParams>, res: Response) => {
    try {
      await conquistaService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Conquista não encontrada para exclusão." });
    }
  },
};
