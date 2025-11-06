import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { bimestreService } from "./bimestre.service";
import {
  CreateBimestreInput,
  FindAllBimestresInput,
  FindVigenteInput,
  UpdateBimestreInput,
} from "./bimestre.validator";

export const bimestreController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bimestre = await bimestreService.create(
        req.body as CreateBimestreInput,
        req.user
      );
      return res.status(201).json(bimestre);
    } catch (error: any) {
      const message =
        error?.message ?? "Não foi possível criar o bimestre.";
      return res.status(400).json({ message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bimestres = await bimestreService.findAll(
        req.user,
        req.query as FindAllBimestresInput
      );
      return res.status(200).json(bimestres);
    } catch (error: any) {
      const message =
        error?.message ?? "Não foi possível buscar os bimestres.";
      return res.status(400).json({ message });
    }
  },

  findVigente: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bimestre = await bimestreService.findVigente(
        req.user,
        req.query as FindVigenteInput
      );
      if (!bimestre) {
        return res
          .status(404)
          .json({ message: "Nenhum bimestre vigente encontrado." });
      }
      return res.status(200).json(bimestre);
    } catch (error: any) {
      const message =
        error?.message ?? "Não foi possível identificar o bimestre vigente.";
      return res.status(400).json({ message });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bimestre = await bimestreService.update(
        req.params.id,
        req.body as UpdateBimestreInput,
        req.user
      );
      return res.status(200).json(bimestre);
    } catch (error: any) {
      if (error?.code === "P2025") {
        return res.status(404).json({ message: error.message });
      }
      const message =
        error?.message ?? "Não foi possível atualizar o bimestre.";
      return res.status(400).json({ message });
    }
  },
};
