import prisma from "../../utils/prisma";
import bcrypt from "bcryptjs";
import { CreateUsuarioInput, UpdateUsuarioInput } from "./usuario.validator";

const sanitizeUser = (user: any) => {
  const { senha_hash, cpf_criptografado, ...sanitizedUser } = user;
  return sanitizedUser;
};

export const usuarioService = {
  create: async (data: CreateUsuarioInput) => {
    const { senha, cpf, ...restData } = data;

    const senha_hash = await bcrypt.hash(senha, 10);

    const cpf_criptografado = cpf ? Buffer.from(cpf) : undefined;

    const user = await prisma.usuarios.create({
      data: {
        ...restData,
        senha_hash,
        cpf_criptografado,
      },
    });

    return sanitizeUser(user);
  },

  findAll: async () => {
    const users = await prisma.usuarios.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        data_nascimento: true,
        email_responsavel: true,
        desabilitado: true,
        criado_em: true,
        atualizado_em: true,
        instituicaoId: true,
        unidadeEscolarId: true,
      },
    });
    return users;
  },

  findById: async (id: string) => {
    const user = await prisma.usuarios.findUnique({
      where: { id },
    });

    if (!user) return null;
    return sanitizeUser(user);
  },

  findByEmail: async (email: string) => {
    return await prisma.usuarios.findUnique({
      where: { email },
    });
  },

  update: async (id: string, data: UpdateUsuarioInput) => {
    const user = await prisma.usuarios.update({
      where: { id },
      data,
    });
    return sanitizeUser(user);
  },

  delete: async (id: string) => {
    await prisma.usuarios.delete({
      where: { id },
    });
    return;
  },
};
