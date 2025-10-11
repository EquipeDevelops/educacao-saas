import { Response, NextFunction } from "express";
import { materiaService } from "./materia.service";
import { CreateMateriaInput } from "./materia.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const materiaController = {
  create: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    console.log("[MateriaController] Recebida requisição para CRIAR matéria.");
    try {
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res.status(403).json({
          message:
            "Apenas gestores de uma unidade escolar podem criar matérias.",
        });
      }
      const materia = await materiaService.create(
        req.body as CreateMateriaInput,
        unidadeEscolarId
      );
      console.log(
        `[MateriaController] Matéria criada com sucesso: ${materia.id}`
      );
      return res.status(201).json(materia);
    } catch (error) {
      console.error("[MateriaController] Erro ao CRIAR matéria:", error);
      next(error);
    }
  },

  findAll: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    console.log(
      "[MateriaController] Recebida requisição para LISTAR matérias."
    );
    try {
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res.status(200).json([]);
      }
      const materias = await materiaService.findAll(unidadeEscolarId);
      console.log(
        `[MateriaController] ${materias.length} matérias encontradas.`
      );
      return res.status(200).json(materias);
    } catch (error) {
      console.error("[MateriaController] Erro ao LISTAR matérias:", error);
      next(error);
    }
  },

  update: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    console.log(
      `[MateriaController] Recebida requisição para ATUALIZAR matéria ID: ${req.params.id}`
    );
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res
          .status(404)
          .json({ message: "Matéria não encontrada para atualizar." });
      }
      const result = await materiaService.update(
        id,
        req.body,
        unidadeEscolarId
      );
      if (result.count === 0) {
        console.warn(
          `[MateriaController] Nenhuma matéria encontrada com o ID: ${id} para atualizar.`
        );
        return res
          .status(404)
          .json({ message: "Matéria não encontrada para atualizar." });
      }
      console.log(
        `[MateriaController] Matéria ID: ${id} atualizada com sucesso.`
      );
      return res
        .status(200)
        .json({ message: "Matéria atualizada com sucesso." });
    } catch (error) {
      console.error(
        `[MateriaController] ERRO ao atualizar matéria ID: ${req.params.id}`,
        error
      );
      next(error);
    }
  },

  remove: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    console.log(
      `[MateriaController] Recebida requisição para DELETAR matéria ID: ${req.params.id}`
    );
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res
          .status(404)
          .json({ message: "Matéria não encontrada para deletar." });
      }

      console.log(
        `[MateriaController] Chamando materiaService.remove para o ID: ${id}`
      );
      const result = await materiaService.remove(id, unidadeEscolarId);

      if (result.count === 0) {
        console.warn(
          `[MateriaController] Nenhuma matéria encontrada com o ID: ${id} para deletar.`
        );
        return res
          .status(404)
          .json({ message: "Matéria não encontrada para deletar." });
      }

      console.log(
        `[MateriaController] Matéria ID: ${id} deletada com sucesso.`
      );
      return res.status(204).send();
    } catch (error) {
      console.error(
        `[MateriaController] ERRO ao deletar matéria ID: ${req.params.id}`,
        error
      );
      next(error);
    }
  },
};
