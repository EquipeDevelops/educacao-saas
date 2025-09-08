import prisma from "../../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PapelUsuario } from "@prisma/client";
import { RegisterInput, LoginInput } from "./auth.validator";

const sanitizeUser = (user: any) => {
  const { senha_hash, ...sanitizedUser } = user;
  return sanitizedUser;
};

export const authService = {
  register: async (data: RegisterInput) => {
    const { nome, email, senha, instituicaoId } = data;

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: instituicaoId },
    });
    if (!instituicao) {
      throw new Error("Instituição não encontrada.");
    }

    const emailExistente = await prisma.usuarios.findUnique({
      where: { email },
    });
    if (emailExistente) {
      throw new Error("Este email já está em uso.");
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const novoUsuario = await prisma.usuarios.create({
      data: {
        nome,
        email,
        senha_hash,
        instituicaoId,
        papel: PapelUsuario.ALUNO,
      },
    });

    return sanitizeUser(novoUsuario);
  },

  login: async (data: LoginInput) => {
    const { email, senha } = data;

    const usuario = await prisma.usuarios.findUnique({ where: { email } });
    if (!usuario) {
      throw new Error("Credenciais inválidas.");
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash!);
    if (!senhaValida) {
      throw new Error("Credenciais inválidas.");
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        papel: usuario.papel,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "8h" }
    );

    return {
      usuario: sanitizeUser(usuario),
      token,
    };
  },
};
