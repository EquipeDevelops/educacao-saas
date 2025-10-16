import { Response } from "express";
import { respostaService } from "./respostaSubmissao.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { GradeRespostaInput } from "./respostaSubmissao.validator";

export const respostaController = {
  saveAnswers: async (req: AuthenticatedRequest, res: Response) => {
    try {
      await respostaService.saveAnswers(
        req.params.submissaoId,
        req.body.respostas,
        req.user
      );
      return res
        .status(200)
        .json({ message: "Respostas salvas e tarefa enviada com sucesso." });
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if (error.code === "LOCKED")
        return res.status(423).json({ message: error.message });
      return res.status(500).json({ message: "Erro ao salvar respostas." });
    }
  },

  gradeAnswer: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { nota, feedback } = req.body as GradeRespostaInput["body"];

      const respostaAvaliada = await respostaService.gradeAnswer(
        id,
        { nota, feedback },
        req.user
      );
      return res.status(200).json(respostaAvaliada);
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      return res
        .status(404)
        .json({ message: "Resposta não encontrada para avaliação." });
    }
  },
};
