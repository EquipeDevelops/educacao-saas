import { Response } from "express";
import { conquistaUsuarioService } from "./conquistaUsuario.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { FindAllConquistasUsuarioInput } from "./conquistaUsuario.validator";

export const conquistaUsuarioController = {
  grant: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conquistaAtribuida = await conquistaUsuarioService.grant(
        req.body,
        req.user
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
      const conquistas = await conquistaUsuarioService.findAll(
        req.user,
        req.query as FindAllConquistasUsuarioInput
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
      const conquista = await conquistaUsuarioService.findById(
        req.params.id,
        req.user
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
      await conquistaUsuarioService.revoke(req.params.id, req.user);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(403).json({ message: error.message });
    }
  },
};
