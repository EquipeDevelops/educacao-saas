import { Response } from "express";
import * as UsuarioService from "./usuario.service";
import { CreateUserInput } from "./usuario.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const usuarioController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { user: gestor } = req;
      const dataToCreate = req.body as CreateUserInput;

      if (
        dataToCreate.papel === "ADMINISTRADOR" ||
        dataToCreate.papel === "GESTOR"
      ) {
        return res
          .status(403)
          .json({ message: "Gestores só podem criar Professores e Alunos." });
      }

      const payload = {
        ...dataToCreate,
        instituicaoId: gestor.instituicaoId!,
        unidadeEscolarId: gestor.unidadeEscolarId!,
      };

      const novoUsuario = await prisma.$transaction(async (tx) => {
        return await UsuarioService.createUser(payload, tx);
      });

      return res.status(201).json(novoUsuario);
    } catch (error: any) {
      if (error.code === "P2002")
        return res.status(409).json({ message: "Este email já está em uso." });
      return res
        .status(500)
        .json({ message: error.message || "Erro interno ao criar usuário." });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { user } = req;
      const where: Prisma.UsuariosWhereInput = {};
      if (user.instituicaoId) {
        where.instituicaoId = user.instituicaoId;
      }

      if (user.papel === "GESTOR" && user.unidadeEscolarId) {
        where.unidadeEscolarId = user.unidadeEscolarId;
      }

      const usuarios = await UsuarioService.findAllUsers(where);
      return res.status(200).json(usuarios);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar usuários." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { user } = req;
      const where: Prisma.UsuariosWhereInput = {};

      if (user.papel === "PROFESSOR" || user.papel === "ALUNO") {
        if (user.id !== id) {
          return res.status(403).json({ message: "Acesso não autorizado." });
        }
      }

      if (user.instituicaoId) {
        where.instituicaoId = user.instituicaoId;
      }
      if (user.papel === "GESTOR" && user.unidadeEscolarId) {
        where.unidadeEscolarId = user.unidadeEscolarId;
      }

      const usuario = await UsuarioService.findUserById(id, where);
      if (!usuario)
        return res.status(404).json({ message: "Usuário não encontrado." });

      return res.status(200).json(usuario);
    } catch (error: any) {
      console.error("[ERRO NO CONTROLLER - findById]:", error);
      return res.status(500).json({ message: "Erro ao buscar usuário." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { user } = req;
      const where: Prisma.UsuariosWhereInput = {};

      if (user.papel === "PROFESSOR") {
        if (user.id !== id) {
          return res.status(403).json({ message: "Acesso não autorizado." });
        }
      } else if (user.papel === "GESTOR" && user.unidadeEscolarId) {
        where.unidadeEscolarId = user.unidadeEscolarId;
      }

      if (user.instituicaoId) {
        where.instituicaoId = user.instituicaoId;
      }

      const usuarioAtualizado = await UsuarioService.updateUser(
        id,
        req.body,
        where
      );
      return res.status(200).json(usuarioAtualizado);
    } catch (error: any) {
      console.error("[ERRO NO CONTROLLER - update]:", error);
      return res
        .status(500)
        .json({ message: error.message || "Erro ao atualizar usuário." });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { user } = req;
      const where: Prisma.UsuariosWhereInput = {};

      if (user.instituicaoId) {
        where.instituicaoId = user.instituicaoId;
      }
      if (user.papel === "GESTOR" && user.unidadeEscolarId) {
        where.unidadeEscolarId = user.unidadeEscolarId;
      }

      await UsuarioService.deleteUser(id, where);
      return res.status(204).send();
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message || "Erro ao deletar usuário." });
    }
  },
};
