import { Response } from "express";
import { submissaoService } from "./submissao.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { FindAllSubmissoesInput } from "./submissao.validator";

export const submissaoController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const submissao = await submissaoService.create(req.body, req.user);
      return res.status(201).json(submissao);
    } catch (error: any) {
      if (error.message.includes("Jǭ existe uma submissǜo"))
        return res.status(409).json({ message: error.message });
      if (error.message.includes("nǜo estǭ matriculado"))
        return res.status(403).json({ message: error.message });
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const submissoes = await submissaoService.findAll(
        req.user,
        req.query as FindAllSubmissoesInput
      );
      return res.status(200).json(submissoes);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar submiss��es." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const submissao = await submissaoService.findById(id, req.user);
      if (!submissao)
        return res.status(404).json({
          message: "Submissǜo nǜo encontrada ou acesso nǜo permitido.",
        });
      return res.status(200).json(submissao);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar submissǜo." });
    }
  },

  grade: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const submissao = await submissaoService.grade(id, req.body, req.user);
      return res.status(200).json(submissao);
    } catch (error: any) {
      if (error.message.includes("nǜo tem permissǜo"))
        return res.status(403).json({ message: error.message });
      if ((error as any).code === "NO_ACTIVE_BIMESTRE")
        return res.status(400).json({ message: error.message });
      if (error.message.includes("matr��cula ativa"))
        return res.status(400).json({ message: error.message });
      return res
        .status(404)
        .json({ message: "Submissǜo nǜo encontrada para avalia��ǜo." });
    }
  },
};
