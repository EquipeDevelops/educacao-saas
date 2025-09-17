import { Response } from "express";
import { unidadeEscolarService } from "./unidadeEscolar.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const unidadeEscolarController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user;
      const unidade = await unidadeEscolarService.create(
        req.body,
        instituicaoId!
      );
      return res.status(201).json(unidade);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao criar unidade escolar." });
    }
  },
  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user;
      const unidades = await unidadeEscolarService.findAll(instituicaoId!);
      return res.status(200).json(unidades);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar unidades escolares." });
    }
  },
  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const unidade = await unidadeEscolarService.findById(id, instituicaoId!);
      if (!unidade)
        return res
          .status(404)
          .json({ message: "Unidade Escolar não encontrada." });
      return res.status(200).json(unidade);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar unidade escolar." });
    }
  },
  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const result = await unidadeEscolarService.update(
        id,
        req.body,
        instituicaoId!
      );
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Unidade Escolar não encontrada para atualizar." });
      return res
        .status(200)
        .json({ message: "Unidade Escolar atualizada com sucesso." });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao atualizar unidade escolar." });
    }
  },
  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const result = await unidadeEscolarService.remove(id, instituicaoId!);
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Unidade Escolar não encontrada para deletar." });
      return res.status(204).send();
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao deletar unidade escolar." });
    }
  },
};
