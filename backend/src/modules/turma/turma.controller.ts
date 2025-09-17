import { Response } from "express";
import { turmaService } from "./turma.service";
import { CreateTurmaInput, UpdateTurmaInput } from "./turma.validator";
import { AuthenticatedRequest } from "../../middlewares/auth"; // <-- 1. IMPORTA O TIPO

export const turmaController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    // <-- 2. USA O TIPO
    try {
      // 3. USA O DADO REAL E SEGURO DO TOKEN, SUBSTITUINDO O PLACEHOLDER
      const { instituicaoId } = req.user;
      const turma = await turmaService.create(
        req.body as CreateTurmaInput,
        instituicaoId!
      );
      return res.status(201).json(turma);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao criar turma.", error: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user;
      const turmas = await turmaService.findAll(instituicaoId!);
      return res.status(200).json(turmas);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar turmas.", error: error.message });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const turma = await turmaService.findById(id, instituicaoId!);

      if (!turma) {
        return res.status(404).json({
          message: "Turma não encontrada ou não pertence a esta instituição.",
        });
      }
      return res.status(200).json(turma);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar turma.", error: error.message });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      // O 'as any' é um truque para o TypeScript aceitar a tipagem complexa, a validação já foi feita
      const result = await turmaService.update(
        id,
        req.body as any,
        instituicaoId!
      );
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Turma não encontrada para atualizar." });
      return res.status(200).json({ message: "Turma atualizada com sucesso." });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao atualizar turma.", error: error.message });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const result = await turmaService.remove(id, instituicaoId!);
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Turma não encontrada para deletar." });
      return res.status(204).send();
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao deletar turma.", error: error.message });
    }
  },
};
