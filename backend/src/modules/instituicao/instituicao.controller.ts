import { Request, Response } from "express";
import { instituicaoService } from "./instituicao.service";
import {
  InstituicaoParams,
  CreateInstituicaoInput,
  UpdateInstituicaoInput,
} from "./instituicao.validator";

export const instituicaoController = {
  create: async (
    req: Request<{}, {}, CreateInstituicaoInput>,
    res: Response
  ) => {
    try {
      const novaInstituicao = await instituicaoService.create(req.body);
      return res.status(201).json(novaInstituicao);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao criar instituição.", error });
    }
  },

  findAll: async (_req: Request, res: Response) => {
    try {
      const instituicoes = await instituicaoService.findAll();
      return res.status(200).json(instituicoes);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar instituições.", error });
    }
  },

  findById: async (req: Request<InstituicaoParams>, res: Response) => {
    try {
      const instituicao = await instituicaoService.findById(req.params.id);
      if (!instituicao) {
        return res.status(404).json({ message: "Instituição não encontrada." });
      }
      return res.status(200).json(instituicao);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar instituição.", error });
    }
  },

  update: async (
    req: Request<InstituicaoParams, {}, UpdateInstituicaoInput>,
    res: Response
  ) => {
    try {
      const instituicaoAtualizada = await instituicaoService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(instituicaoAtualizada);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "PrismaClientKnownRequestError"
      ) {
        return res
          .status(404)
          .json({ message: "Instituição não encontrada para atualização." });
      }
      return res
        .status(500)
        .json({ message: "Erro ao atualizar instituição.", error });
    }
  },

  delete: async (req: Request<InstituicaoParams>, res: Response) => {
    try {
      await instituicaoService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "PrismaClientKnownRequestError"
      ) {
        return res
          .status(404)
          .json({ message: "Instituição não encontrada para exclusão." });
      }
      return res
        .status(500)
        .json({ message: "Erro ao deletar instituição.", error });
    }
  },
};
