import { Response } from "express";
import { alunoService } from "./aluno.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const alunoController = {
  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unidadeEscolarId } = req.user;
      const alunos = await alunoService.findAllPerfis(unidadeEscolarId!);
      return res.status(200).json(alunos);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar perfis de alunos." });
    }
  },
};
