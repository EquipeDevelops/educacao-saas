import { Request, Response } from "express";
import { opcaoService } from "./opcaoMultiplaEscolha.service";
import {
  CreateOpcaoInput,
  UpdateOpcaoInput,
  OpcaoParams,
} from "./opcaoMultiplaEscolha.validator";

export const opcaoController = {
  create: async (req: Request<{}, {}, CreateOpcaoInput>, res: Response) => {
    try {
      const novaOpcao = await opcaoService.create(req.body);
      return res.status(201).json(novaOpcao);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  findAllByQuestao: async (req: Request, res: Response) => {
    try {
      const { questaoId } = req.query;
      if (!questaoId) {
        return res.status(400).json({
          message: "O ID da questão é obrigatório para listar as opções.",
        });
      }
      const opcoes = await opcaoService.findAllByQuestao(questaoId as string);
      return res.status(200).json(opcoes);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar opções." });
    }
  },

  update: async (
    req: Request<OpcaoParams, {}, UpdateOpcaoInput>,
    res: Response
  ) => {
    try {
      const opcaoAtualizada = await opcaoService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(opcaoAtualizada);
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Opção não encontrada para atualização." });
    }
  },

  delete: async (req: Request<OpcaoParams>, res: Response) => {
    try {
      await opcaoService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Opção não encontrada para exclusão." });
    }
  },
};
