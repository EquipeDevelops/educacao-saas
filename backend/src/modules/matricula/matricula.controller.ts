import { Response } from "express";
import { matriculaService } from "./matricula.service";
import {
  CreateMatriculaInput,
  FindAllMatriculasInput,
  UpdateMatriculaInput,
} from "./matricula.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const matriculaController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const matricula = await matriculaService.create(
        req.body as CreateMatriculaInput,
        req.user // Passa o usuário inteiro para o serviço
      );
      return res.status(201).json(matricula);
    } catch (error: any) {
      if (error.message.includes("já possui uma matrícula")) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const matriculas = await matriculaService.findAll(
        req.user,
        req.query as FindAllMatriculasInput
      );
      return res.status(200).json(matriculas);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar matrículas.", error: error.message });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const matricula = await matriculaService.findById(id, req.user);
      if (!matricula) {
        return res.status(404).json({ message: "Matrícula não encontrada." });
      }
      return res.status(200).json(matricula);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar matrícula." });
    }
  },

  updateStatus: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body as UpdateMatriculaInput["body"];
      const matricula = await matriculaService.updateStatus(
        id,
        status,
        req.user
      );
      return res.status(200).json(matricula);
    } catch (error: any) {
      if ((error as any).code === "P2025") {
        return res
          .status(404)
          .json({ message: "Matrícula não encontrada para atualização." });
      }
      return res.status(500).json({ message: "Erro ao atualizar matrícula." });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      await matriculaService.remove(id, req.user);
      return res.status(204).send();
    } catch (error: any) {
      if ((error as any).code === "P2025") {
        return res
          .status(404)
          .json({ message: "Matrícula não encontrada para exclusão." });
      }
      return res.status(500).json({ message: "Erro ao deletar matrícula." });
    }
  },
};
