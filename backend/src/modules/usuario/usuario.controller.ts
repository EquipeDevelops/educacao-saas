import { Request, Response } from "express";
import * as UsuarioService from "./usuario.service";
import { CreateUserInput, UpdateUserInput } from "./usuario.validator";

export const usuarioController = {
  create: async (req: Request<{}, {}, CreateUserInput>, res: Response) => {
    try {
      const novoUsuario = await UsuarioService.createUser(req.body);
      return res.status(201).json(novoUsuario);
    } catch (error: any) {
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        return res.status(409).json({ message: "Este email já está em uso." });
      }
      return res.status(500).json({
        message: "Erro interno ao criar usuário.",
        error: error.message,
      });
    }
  },

  findAll: async (_req: Request, res: Response) => {
    try {
      const usuarios = await UsuarioService.findAllUsers();
      return res.status(200).json(usuarios);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar usuários.", error: error.message });
    }
  },

  findById: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const usuario = await UsuarioService.findUserById(id);
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }
      return res.status(200).json(usuario);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar usuário.", error: error.message });
    }
  },

  update: async (
    req: Request<UpdateUserInput["params"], {}, UpdateUserInput["body"]>,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      const usuarioAtualizado = await UsuarioService.updateUser(id, req.body);
      return res.status(200).json(usuarioAtualizado);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ message: "Usuário não encontrado para atualização." });
      }
      return res
        .status(500)
        .json({ message: "Erro ao atualizar usuário.", error: error.message });
    }
  },

  remove: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      await UsuarioService.deleteUser(id);
      return res.status(204).send();
    } catch (error: any) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ message: "Usuário não encontrado para exclusão." });
      }
      return res
        .status(500)
        .json({ message: "Erro ao deletar usuário.", error: error.message });
    }
  },
};
