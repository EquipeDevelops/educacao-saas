import { Response } from "express";
import { professorService } from "./professor.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const professorController = {
  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user;
      const professores = await professorService.findAllPerfis(instituicaoId!);
      return res.status(200).json(professores);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar perfis de professores." });
    }
  },
};
