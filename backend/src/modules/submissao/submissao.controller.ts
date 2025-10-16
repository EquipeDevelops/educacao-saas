import { Response } from "express";
import { submissaoService } from "./submissao.service";
import { AuthenticatedRequest } from "../../middlewares/auth"; // <-- IMPORTA O TIPO
import { FindAllSubmissoesInput } from "./submissao.validator";

export const submissaoController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const submissao = await submissaoService.create(req.body, req.user);
      return res.status(201).json(submissao);
    } catch (error: any) {
      if (error.message.includes("Já existe uma submissão"))
        return res.status(409).json({ message: error.message });
      if (error.message.includes("não está matriculado"))
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
      return res.status(500).json({ message: "Erro ao buscar submissões." });
    }
  },
  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      // O serviço 'findById' precisa do objeto 'user' inteiro para checar se é o aluno dono OU o professor da tarefa
      const submissao = await submissaoService.findById(id, req.user);
      if (!submissao)
        return res.status(404).json({
          message: "Submissão não encontrada ou acesso não permitido.",
        });
      return res.status(200).json(submissao);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar submissão." });
    }
  },

  grade: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const submissao = await submissaoService.grade(id, req.body, req.user);
      return res.status(200).json(submissao);
    } catch (error: any) {
      if (error.message.includes("não tem permissão"))
        return res.status(403).json({ message: error.message });
      return res
        .status(404)
        .json({ message: "Submissão não encontrada para avaliação." });
    }
  },
};
