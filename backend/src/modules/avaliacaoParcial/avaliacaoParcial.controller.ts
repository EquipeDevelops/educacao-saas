import { Response } from "express";
import { avaliacaoService } from "./avaliacaoParcial.service";
import { AuthenticatedRequest } from "../../middlewares/auth"; // <-- IMPORTA O TIPO
import {
  CreateAvaliacaoInput,
  FindAllAvaliacoesInput,
} from "./avaliacaoParcial.validator";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // Instância para consulta específica do controller

export const avaliacaoController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId, perfilId: professorId } = req.user;
      const avaliacao = await avaliacaoService.create(
        req.body as CreateAvaliacaoInput,
        professorId!,
        instituicaoId!
      );
      return res.status(201).json(avaliacao);
    } catch (error: any) {
      return res.status(403).json({ message: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId, papel, perfilId } = req.user;
      let filters = req.query as FindAllAvaliacoesInput;

      // SEGURANÇA E LGPD: Se o usuário for um aluno, força o filtro para apenas suas próprias notas.
      if (papel === "ALUNO") {
        // Para um aluno, precisamos encontrar a matrícula dele no ano letivo atual para filtrar as notas.
        const anoLetivoAtual = new Date().getFullYear();
        const matricula = await prisma.matriculas.findFirst({
          where: {
            alunoId: perfilId!,
            ano_letivo: anoLetivoAtual,
            status: "ATIVA",
          },
        });
        // Se não tiver matrícula ativa, não retorna nenhuma nota.
        filters.matriculaId = matricula?.id || "nenhuma-matricula-encontrada";
      }

      const avaliacoes = await avaliacaoService.findAll(
        instituicaoId!,
        filters
      );
      return res.status(200).json(avaliacoes);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar avaliações." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const avaliacao = await avaliacaoService.findById(id, instituicaoId!);
      if (!avaliacao)
        return res.status(404).json({ message: "Avaliação não encontrada." });
      return res.status(200).json(avaliacao);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar avaliação." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId, perfilId: professorId } = req.user;
      const avaliacao = await avaliacaoService.update(
        id,
        req.body,
        professorId!,
        instituicaoId!
      );
      return res.status(200).json(avaliacao);
    } catch (error: any) {
      if ((error as any).code === "P2025")
        return res.status(404).json({ message: error.message });
      return res.status(403).json({ message: error.message });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId, perfilId: professorId } = req.user;
      await avaliacaoService.remove(id, professorId!, instituicaoId!);
      return res.status(204).send();
    } catch (error: any) {
      if ((error as any).code === "P2025")
        return res.status(404).json({ message: error.message });
      return res.status(403).json({ message: error.message });
    }
  },
};
