import { Response } from "express";
import { conquistaUsuarioService } from "./conquistaUsuario.service";
import { AuthenticatedRequest } from "../../middlewares/auth"; // <-- IMPORTA O TIPO
import { FindAllConquistasUsuarioInput } from "./conquistaUsuario.validator";

export const conquistaUsuarioController = {
  grant: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId } = req.user; // <-- USA O DADO REAL E SEGURO
      const conquistaAtribuida = await conquistaUsuarioService.grant(
        req.body,
        instituicaoId!
      );
      return res.status(201).json(conquistaAtribuida);
    } catch (error: any) {
      if (error.message.includes("já possui esta conquista")) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instituicaoId, papel, perfilId } = req.user;
      let filters = req.query as FindAllConquistasUsuarioInput;

      // SEGURANÇA E LGPD: Se o usuário for um aluno, força o filtro para apenas suas próprias conquistas.
      if (papel === "ALUNO") {
        filters.alunoPerfilId = perfilId!;
      }

      const conquistas = await conquistaUsuarioService.findAll(
        instituicaoId!,
        filters
      );
      return res.status(200).json(conquistas);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar conquistas de usuários." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const conquista = await conquistaUsuarioService.findById(
        id,
        instituicaoId!
      );
      if (!conquista)
        return res
          .status(404)
          .json({ message: "Registro de conquista não encontrado." });
      return res.status(200).json(conquista);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar registro de conquista." });
    }
  },

  revoke: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { instituicaoId } = req.user;
      const result = await conquistaUsuarioService.revoke(id, instituicaoId!);
      if (result.count === 0) {
        return res.status(404).json({
          message: "Registro de conquista não encontrado para revogar.",
        });
      }
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao revogar conquista." });
    }
  },
};
