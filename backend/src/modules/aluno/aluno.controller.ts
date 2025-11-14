import { Request, Response, NextFunction } from "express";
import { alunoService } from "./aluno.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const alunoController = {
  findAll: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res.status(403).json({
          message: "Usuário não está associado a uma unidade escolar.",
        });
      }
      const alunos = await alunoService.findAllPerfis(unidadeEscolarId);
      res.json(alunos);
    } catch (error) {
      next(error);
    }
  },

  findOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // ID do USUÁRIO
      const aluno = await alunoService.findOne(id);
      if (!aluno) {
        return res.status(404).json({ message: "Aluno não encontrado." });
      }
      res.json(aluno);
    } catch (error) {
      next(error);
    }
  },

  getBoletim: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params; // ID do USUÁRIO do aluno
      console.log(`[CONTROLLER] Requisição para boletim do usuário ID: ${id}`);
      const boletimData = await alunoService.getBoletim(id);
      res.json(boletimData);
    } catch (error) {
      next(error);
    }
  },

  getBoletimPdf: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      if (req.user?.papel === "ALUNO" && req.user.id !== id) {
        return res.status(403).json({
          message: "Você só pode baixar o seu próprio boletim.",
        });
      }

      const pdfBytes = await alunoService.generateBoletimPdf(id);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=boletim_${id}.pdf`
      );
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      next(error);
    }
  },

  getAgendaMensal: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user?.perfilId) {
        return res.status(403).json({
          message: "Perfil de aluno não encontrado para o usuário autenticado.",
        });
      }

      const parseDate = (value: unknown) => {
        if (!value) return null;
        const raw = Array.isArray(value) ? value[0] : value;
        const parsed = new Date(String(raw));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const today = new Date();
      const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const startDate = parseDate(req.query.start) ?? defaultStart;
      const endDate = parseDate(req.query.end) ?? defaultEnd;

      if (startDate > endDate) {
        return res.status(400).json({
          message: "A data inicial não pode ser maior que a data final.",
        });
      }

      const eventos = await alunoService.getAgendaEventos(
        req.user,
        startDate,
        endDate
      );

      res.json({ eventos });
    } catch (error) {
      next(error);
    }
  },

  getProfile: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const profileData = await alunoService.getProfile(req.user);
      res.json(profileData);
    } catch (error) {
      next(error);
    }
  },
};
