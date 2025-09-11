import { Request, Response } from "express";
import { matriculaService } from "./matricula.service";
import {
  CreateMatriculaInput,
  UpdateMatriculaInput,
  MatriculaParams,
} from "./matricula.validator";

export const matriculaController = {
  create: async (req: Request<{}, {}, CreateMatriculaInput>, res: Response) => {
    try {
      const novaMatricula = await matriculaService.create(req.body);
      return res.status(201).json(novaMatricula);
    } catch (error: any) {
      if (error.message.includes("já está matriculado")) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const { turmaId, alunoId } = req.query;
      const filters = {
        turmaId: turmaId as string | undefined,
        alunoId: alunoId as string | undefined,
      };

      const matriculas = await matriculaService.findAll(filters);
      return res.status(200).json(matriculas);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar matrículas." });
    }
  },

  findById: async (req: Request<MatriculaParams>, res: Response) => {
    try {
      const matricula = await matriculaService.findById(req.params.id);
      if (!matricula) {
        return res.status(404).json({ message: "Matrícula não encontrada." });
      }
      return res.status(200).json(matricula);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar matrícula." });
    }
  },

  update: async (
    req: Request<MatriculaParams, {}, UpdateMatriculaInput>,
    res: Response
  ) => {
    try {
      const matriculaAtualizada = await matriculaService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(matriculaAtualizada);
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Matrícula não encontrada para atualização." });
    }
  },

  delete: async (req: Request<MatriculaParams>, res: Response) => {
    try {
      await matriculaService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Matrícula não encontrada para exclusão." });
    }
  },
};
