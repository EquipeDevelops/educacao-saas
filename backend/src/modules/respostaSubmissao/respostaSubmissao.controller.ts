import { Request, Response } from "express";
import { respostaService } from "./respostaSubmissao.service";
import { CreateRespostasInput } from "./respostaSubmissao.validator";

export const respostaController = {
  createMany: async (
    req: Request<
      { submissaoId: string },
      {},
      { respostas: CreateRespostasInput }
    >,
    res: Response
  ) => {
    try {
      const { submissaoId } = req.params;
      const { respostas } = req.body;

      const result = await respostaService.createMany(submissaoId, respostas);
      return res.status(201).json({
        message: `${result.count} respostas foram salvas com sucesso.`,
      });
    } catch (error: any) {
      if (error.message.includes("não pertence à tarefa")) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes("Submissão não encontrada")) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: "Erro ao salvar respostas." });
    }
  },
};
