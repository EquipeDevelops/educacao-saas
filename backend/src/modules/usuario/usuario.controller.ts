
import { Response } from "express";
import * as UsuarioService from "./usuario.service";
import { CreateUserInput, UpdateUserInput } from "./usuario.validator";
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
      const where: Prisma.UsuariosWhereInput = {
        instituicaoId: user.instituicaoId,
      };

      if (user.papel === "GESTOR") {
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
      const where: Prisma.UsuariosWhereInput = {
        instituicaoId: user.instituicaoId,
      };
      if (user.papel === "GESTOR")
        where.unidadeEscolarId = user.unidadeEscolarId;

      const usuario = await UsuarioService.findUserById(id, where);
      if (!usuario)
        return res.status(404).json({ message: "Usuário não encontrado." });

      return res.status(200).json(usuario);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar usuário." });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { user } = req;
      const where: Prisma.UsuariosWhereInput = {
        instituicaoId: user.instituicaoId,
      };
      if (user.papel === "GESTOR")
        where.unidadeEscolarId = user.unidadeEscolarId;

      const usuarioAtualizado = await UsuarioService.updateUser(
        id,
        req.body,
        where
      );
      return res.status(200).json(usuarioAtualizado);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message || "Erro ao atualizar usuário." });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { user } = req;
      const where: Prisma.UsuariosWhereInput = {
        instituicaoId: user.instituicaoId,
      };
      if (user.papel === "GESTOR")
        where.unidadeEscolarId = user.unidadeEscolarId;

      await UsuarioService.deleteUser(id, where);
      return res.status(204).send();
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message || "Erro ao deletar usuário." });
    }
  },

  // 🔄 Função adicionada para ativar/desativar usuário
  toggleStatus: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { user } = req;

      const where: Prisma.UsuariosWhereInput = {
        instituicaoId: user.instituicaoId,
      };
      if (user.papel === "GESTOR") {
        where.unidadeEscolarId = user.unidadeEscolarId;
      }

      const usuario = await UsuarioService.findUserById(id, where);
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      const novoStatus = !usuario.status;

      const usuarioAtualizado = await UsuarioService.updateUser(
        id,
        { status: novoStatus },
        where
      );

      return res.status(200).json({
        message: `Usuário ${novoStatus ? "ativado" : "desativado"} com sucesso.`,
        usuario: usuarioAtualizado,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Erro ao alterar status do usuário.",
      });
    }
  }, // ⬅️ Fim da função adicionada
};

