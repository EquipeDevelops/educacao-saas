import { Response } from "express";
import { unidadeEscolarService } from "./unidadeEscolar.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const unidadeEscolarController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    // --- LOG DE DEPURAÇÃO ---
    console.log(
      "\n--- [CONTROLLER] Recebida requisição para criar Unidade Escolar ---"
    );
    console.log("Dados do Body (req.body):", JSON.stringify(req.body, null, 2));
    console.log("Dados do Usuário Logado (req.user):", req.user);
    // --- FIM DO LOG ---

    try {
      const { instituicaoId } = req.user;
      if (!instituicaoId) {
        console.error(
          "[ERRO NO CONTROLLER] Admin sem ID de instituição tentou criar uma unidade."
        );
        return res.status(403).json({
          message:
            "Apenas administradores de instituição podem criar unidades.",
        });
      }

      const unidade = await unidadeEscolarService.createWithGestor(
        req.body,
        instituicaoId
      );

      console.log(
        "[SUCESSO NO CONTROLLER] Unidade e Gestor criados com sucesso."
      );
      return res.status(201).json(unidade);
    } catch (error: any) {
      // <-- A CHAVE EXTRA { FOI REMOVIDA DAQUI
      // --- LOG DE DEPURAÇÃO DO ERRO ---
      console.error("--- [ERRO CAPTURADO NO CONTROLLER] ---");
      console.error("Mensagem do Erro:", error.message);
      console.error("Stack do Erro:", error.stack);
      console.error("------------------------------------");
      // --- FIM DO LOG ---

      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ message: "O email do gestor já está em uso." });
      }
      return res.status(500).json({
        message: "Erro ao criar unidade escolar.",
        error: error.message,
      });
    }
  },

  // O restante do controlador permanece o mesmo
  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user;
      const unidades = await unidadeEscolarService.findAll(instituicaoId!);
      return res.status(200).json(unidades);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar unidades escolares." });
    }
  },
  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const unidade = await unidadeEscolarService.findById(id, instituicaoId!);
      if (!unidade)
        return res
          .status(404)
          .json({ message: "Unidade Escolar não encontrada." });
      return res.status(200).json(unidade);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar unidade escolar." });
    }
  },
  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const result = await unidadeEscolarService.update(
        id,
        req.body,
        instituicaoId!
      );
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Unidade Escolar não encontrada para atualizar." });
      return res
        .status(200)
        .json({ message: "Unidade Escolar atualizada com sucesso." });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao atualizar unidade escolar." });
    }
  },
  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const result = await unidadeEscolarService.remove(id, instituicaoId!);
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: "Unidade Escolar não encontrada para deletar." });
      return res.status(204).send();
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao deletar unidade escolar." });
    }
  },
};
