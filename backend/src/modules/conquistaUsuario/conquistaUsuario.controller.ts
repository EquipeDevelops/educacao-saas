import { Request, Response } from "express";
import { conquistaUsuarioService } from "./conquistaUsuario.service";
import { AwardConquistaInput } from "./conquistaUsuario.validator";

export const conquistaUsuarioController = {
  award: async (req: Request<{}, {}, AwardConquistaInput>, res: Response) => {
    try {
      const premiacao = await conquistaUsuarioService.award(req.body);
      return res.status(201).json(premiacao);
    } catch (error: any) {
      if (error.message.includes("já possui"))
        return res.status(409).json({ message: error.message });
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const { usuarioId, conquistaId } = req.query;
      if (usuarioId) {
        const conquistas = await conquistaUsuarioService.findAllByUsuario(
          usuarioId as string
        );
        return res.status(200).json(conquistas);
      }
      if (conquistaId) {
        const usuarios = await conquistaUsuarioService.findAllByConquista(
          conquistaId as string
        );
        return res.status(200).json(usuarios);
      }
      return res
        .status(400)
        .json({ message: "Forneça um usuarioId ou conquistaId para a busca." });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar registros de conquistas." });
    }
  },

  revoke: async (req: Request<{ id: string }>, res: Response) => {
    try {
      await conquistaUsuarioService.revoke(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return res.status(404).json({
        message: "Registro de conquista não encontrado para revogação.",
      });
    }
  },
};
