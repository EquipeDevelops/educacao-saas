import { Request, Response } from "express";
import { instituicaoService } from "./instituicao.service";
import { AuthenticatedRequest } from "../../middlewares/auth"; // <-- IMPORTA O TIPO

export const instituicaoController = {
  // A tipagem é atualizada para consistência, mas req.user não é usado na lógica.
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SEGURANÇA: Uma verificação adicional poderia ser feita aqui para garantir que req.user.instituicaoId é nulo,
      // confirmando que é um Super Admin.
      const instituicao = await instituicaoService.create(req.body);
      return res.status(201).json(instituicao);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao criar instituição." });
    }
  },
  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const instituicoes = await instituicaoService.findAll();
      return res.status(200).json(instituicoes);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar instituições." });
    }
  },
  // ... Handlers para findById, update e remove seguem o mesmo padrão simples ...
  findById: async (req: Request, res: Response) => {
    try {
      const instituicao = await instituicaoService.findById(req.params.id);
      if (!instituicao)
        return res.status(404).json({ message: "Instituição não encontrada." });
      return res.status(200).json(instituicao);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar instituição." });
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const instituicao = await instituicaoService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(instituicao);
    } catch (error: any) {
      return res
        .status(404)
        .json({ message: "Instituição não encontrada para atualizar." });
    }
  },
  remove: async (req: Request, res: Response) => {
    try {
      await instituicaoService.remove(req.params.id);
      return res.status(204).send();
    } catch (error: any) {
      return res
        .status(404)
        .json({ message: "Instituição não encontrada para deletar." });
    }
  },
};
