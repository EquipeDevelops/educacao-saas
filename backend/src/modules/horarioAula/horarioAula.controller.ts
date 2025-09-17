import { Response } from "express";
import { horarioService } from "./horarioAula.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { FindAllHorariosInput } from "./horarioAula.validator";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const horarioController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user;
      const horario = await horarioService.create(req.body, instituicaoId!);
      return res.status(201).json(horario);
    } catch (error: any) {
      if (error.message.includes("Conflito de horário"))
        return res.status(409).json({ message: error.message });
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId, papel, perfilId } = req.user;
      let filters = req.query as FindAllHorariosInput;

      if (papel === "PROFESSOR") {
        filters.professorId = perfilId!;
      } else if (papel === "ALUNO") {
        const anoLetivoAtual = new Date().getFullYear();
        const matricula = await prisma.matriculas.findFirst({
          where: {
            alunoId: perfilId!,
            ano_letivo: anoLetivoAtual,
            status: "ATIVA",
          },
        });
        filters.turmaId = matricula?.turmaId || "nenhuma-turma-encontrada";
      }

      const horarios = await horarioService.findAll(instituicaoId!, filters);
      return res.status(200).json(horarios);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar horários." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const horario = await horarioService.findById(id, instituicaoId!);
      if (!horario)
        return res.status(404).json({ message: "Horário não encontrado." });
      return res.status(200).json(horario);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar horário." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const horario = await horarioService.update(id, req.body, instituicaoId!);
      return res.status(200).json(horario);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      await horarioService.remove(id, instituicaoId!);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  },
};
