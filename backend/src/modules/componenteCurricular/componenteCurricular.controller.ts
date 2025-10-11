import { Response, NextFunction } from "express";
import { componenteCurricularService } from "./componenteCurricular.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { CreateComponenteCurricularInput } from "./componenteCurricular.validator"; // Import com nome corrigido

export const componenteCurricularController = {
  create: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { unidadeEscolarId } = req.user;
      const componente = await componenteCurricularService.create(
        req.body as CreateComponenteCurricularInput,
        unidadeEscolarId
      );
      return res.status(201).json(componente);
    } catch (error) {
      next(error);
    }
  },

  findAll: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { unidadeEscolarId } = req.user;
      const componentes = await componenteCurricularService.findAll(
        unidadeEscolarId
      );
      return res.status(200).json(componentes);
    } catch (error) {
      next(error);
    }
  },

  findById: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      const componente = await componenteCurricularService.findById(
        id,
        unidadeEscolarId
      );
      if (!componente) {
        return res.status(404).json({ message: "Vínculo não encontrado." });
      }
      return res.status(200).json(componente);
    } catch (error) {
      next(error);
    }
  },

  update: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      const result = await componenteCurricularService.update(
        id,
        req.body,
        unidadeEscolarId
      );
      if (result.count === 0) {
        return res
          .status(404)
          .json({ message: "Vínculo não encontrado para atualizar." });
      }
      return res
        .status(200)
        .json({ message: "Vínculo atualizado com sucesso." });
    } catch (error) {
      next(error);
    }
  },

  remove: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      const result = await componenteCurricularService.remove(
        id,
        unidadeEscolarId
      );
      if (result.count === 0) {
        return res
          .status(404)
          .json({ message: "Vínculo não encontrado para deletar." });
      }
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
