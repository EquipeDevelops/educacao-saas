import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { geradorProvaIAService } from "./geradorProvaIA.service";

export const geradorProvaIAController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "O prompt é obrigatório." });
      }

      const pdfBytes = await geradorProvaIAService.gerarProva(prompt);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=prova_gerada.pdf"
      );
      res.send(Buffer.from(pdfBytes));
    } catch (error: any) {
      console.error("Erro ao gerar prova com IA:", error);
      res.status(500).json({ message: "Falha ao gerar o PDF." });
    }
  },

  gerarQuestoes: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "O prompt é obrigatório." });
      }

      const questoes = await geradorProvaIAService.gerarQuestoes(prompt);

      res.status(200).json(questoes);
    } catch (error: any) {
      console.error("Erro ao gerar questões com IA:", error);
      res
        .status(500)
        .json({ message: error.message || "Falha ao gerar as questões." });
    }
  },
};
