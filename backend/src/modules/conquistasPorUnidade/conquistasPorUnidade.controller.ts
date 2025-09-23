import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { conquistasPorUnidadeService } from "./conquistasPorUnidade.service";

export const conquistasPorUnidadeController = {
  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId, unidadeEscolarId } = req.user;
      if (!instituicaoId || !unidadeEscolarId) {
        return res.status(403).json({ message: "Acesso negado." });
      }
      const conquistas = await conquistasPorUnidadeService.findAll(
        instituicaoId,
        unidadeEscolarId
      );
      return res.status(200).json(conquistas);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar conquistas." });
    }
  },
  toggle: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unidadeEscolarId } = req.user;
      const { conquistaId, ativo } = req.body;
      if (!unidadeEscolarId) {
        return res.status(403).json({ message: "Acesso negado." });
      }
      await conquistasPorUnidadeService.toggle(
        conquistaId,
        ativo,
        unidadeEscolarId
      );
      return res
        .status(200)
        .json({ message: "Status da conquista atualizado com sucesso." });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          message:
            error.message ||
            "Não foi possível atualizar o status da conquista.",
        });
    }
  },
};
