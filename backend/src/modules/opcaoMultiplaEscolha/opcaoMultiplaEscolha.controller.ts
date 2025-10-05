import { Response } from "express";
import { opcaoService } from "./opcaoMultiplaEscolha.service";
import {
  SetOpcoesInput,
  UpdateOpcaoInput,
} from "./opcaoMultiplaEscolha.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const opcaoController = {
  setOpcoes: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unidadeEscolarId, perfilId: professorId } = req.user;

      const result = await opcaoService.setOpcoes(
        req as unknown as SetOpcoesInput,
        professorId!,
        unidadeEscolarId!
      );
      return res
        .status(201)
        .json({ message: `${result.count} opções foram salvas com sucesso.` });
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      return res.status(500).json({ message: "Erro ao salvar opções." });
    }
  },

  findAllByQuestao: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { questaoId } = req.params;
      const { unidadeEscolarId, papel } = req.user;

      const isAluno = papel === "ALUNO";
      const opcoes = await opcaoService.findAllByQuestao(
        questaoId,
        unidadeEscolarId!,
        isAluno
      );

      return res.status(200).json(opcoes);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId, perfilId: professorId } = req.user;
      const opcao = await opcaoService.update(
        id,
        req.body as UpdateOpcaoInput["body"],
        professorId!,
        unidadeEscolarId!
      );
      return res.status(200).json(opcao);
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if (error.code === "P2025")
        return res.status(404).json({ message: "Opção não encontrada." });
      return res.status(500).json({ message: "Erro ao atualizar opção." });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { unidadeEscolarId, perfilId: professorId } = req.user;
      await opcaoService.remove(id, professorId!, unidadeEscolarId!);
      return res.status(204).send();
    } catch (error: any) {
      if (error.code === "FORBIDDEN")
        return res.status(403).json({ message: error.message });
      if (error.code === "P2025")
        return res.status(404).json({ message: "Opção não encontrada." });
      return res.status(500).json({ message: "Erro ao deletar opção." });
    }
  },
};
