import { Request, Response } from "express";
import { usuarioService } from "./usuario.service";
import {
  CreateUsuarioInput,
  UpdateUsuarioInput,
  UsuarioParams,
} from "./usuario.validator";

export const usuarioController = {
  create: async (req: Request<{}, {}, CreateUsuarioInput>, res: Response) => {
    try {
      const existingUser = await usuarioService.findByEmail(req.body.email);
      if (existingUser) {
        return res.status(409).json({ message: "Este email já está em uso." });
      }

      const novoUsuario = await usuarioService.create(req.body);
      return res.status(201).json(novoUsuario);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao criar usuário." });
    }
  },

  findAll: async (_req: Request, res: Response) => {
    try {
      const usuarios = await usuarioService.findAll();
      return res.status(200).json(usuarios);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar usuários." });
    }
  },

  findById: async (req: Request<UsuarioParams>, res: Response) => {
    try {
      const usuario = await usuarioService.findById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }
      return res.status(200).json(usuario);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar usuário." });
    }
  },

  update: async (
    req: Request<UsuarioParams, {}, UpdateUsuarioInput>,
    res: Response
  ) => {
    try {
      const usuarioAtualizado = await usuarioService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(usuarioAtualizado);
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Usuário não encontrado para atualização." });
    }
  },

  delete: async (req: Request<UsuarioParams>, res: Response) => {
    try {
      await usuarioService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Usuário não encontrado para exclusão." });
    }
  },
};
