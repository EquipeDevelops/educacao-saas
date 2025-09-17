import { Response } from "express";
import { registroFaltaService } from "./registroFalta.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { FindAllFaltasInput } from "./registroFalta.validator";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const registroFaltaController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId, perfilId: professorId } = req.user;
      const falta = await registroFaltaService.create(
        req.body,
        professorId!,
        instituicaoId!
      );
      return res.status(201).json(falta);
    } catch (error: any) {
      if (error.message.includes("Já existe um registro"))
        return res.status(409).json({ message: error.message });
      return res.status(403).json({ message: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId, papel, perfilId } = req.user;
      let filters = req.query as FindAllFaltasInput;

      if (papel === "ALUNO") {
        const anoLetivoAtual = new Date().getFullYear();
        const matricula = await prisma.matriculas.findFirst({
          where: {
            alunoId: perfilId!,
            ano_letivo: anoLetivoAtual,
            status: "ATIVA",
          },
        });
        filters.matriculaId = matricula?.id || "nenhuma-matricula-encontrada";
      }

      const faltas = await registroFaltaService.findAll(
        instituicaoId!,
        filters
      );
      return res.status(200).json(faltas);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar faltas." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const falta = await registroFaltaService.findById(id, instituicaoId!);
      if (!falta)
        return res
          .status(404)
          .json({ message: "Registro de falta não encontrado." });
      return res.status(200).json(falta);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar registro de falta." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId, perfilId: professorId } = req.user;
      const falta = await registroFaltaService.update(
        id,
        req.body,
        professorId!,
        instituicaoId!
      );
      return res.status(200).json(falta);
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
      await registroFaltaService.remove(id, professorId!, instituicaoId!);
      return res.status(204).send();
    } catch (error: any) {
      if ((error as any).code === "P2025")
        return res.status(404).json({ message: error.message });
      return res.status(403).json({ message: error.message });
    }
  },
};
