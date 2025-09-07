import { Request, Response } from "express";
import { unidadeEscolarService } from "./unidadeEscolar.service";
import {
  CreateUnidadeEscolarInput,
  UpdateUnidadeEscolarInput,
  UnidadeEscolarParams,
} from "./unidadeEscolar.validator";

export const unidadeEscolarController = {
  create: async (
    req: Request<{}, {}, CreateUnidadeEscolarInput>,
    res: Response
  ) => {
    try {
      const novaUnidade = await unidadeEscolarService.create(req.body);
      return res.status(201).json(novaUnidade);
    } catch (error: any) {
      if (error.message === "Instituição não encontrada.") {
        return res.status(400).json({ message: error.message });
      }
      return res
        .status(500)
        .json({ message: "Erro ao criar unidade escolar." });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const { instituicaoId } = req.query;

      const unidades = await unidadeEscolarService.findAll(
        instituicaoId as string | undefined
      );
      return res.status(200).json(unidades);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar unidades escolares." });
    }
  },

  findById: async (req: Request<UnidadeEscolarParams>, res: Response) => {
    try {
      const unidade = await unidadeEscolarService.findById(req.params.id);
      if (!unidade) {
        return res
          .status(404)
          .json({ message: "Unidade escolar não encontrada." });
      }
      return res.status(200).json(unidade);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar unidade escolar." });
    }
  },

  update: async (
    req: Request<UnidadeEscolarParams, {}, UpdateUnidadeEscolarInput>,
    res: Response
  ) => {
    try {
      const unidadeAtualizada = await unidadeEscolarService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(unidadeAtualizada);
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Unidade escolar não encontrada para atualização." });
    }
  },

  delete: async (req: Request<UnidadeEscolarParams>, res: Response) => {
    try {
      await unidadeEscolarService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Unidade escolar não encontrada para exclusão." });
    }
  },
};
