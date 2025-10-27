import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CreateUserInput } from "./usuario.validator";

const prisma = new PrismaClient();
type PrismaTransactionClient = PrismaClient;

interface UserCreationData extends CreateUserInput {
  instituicaoId: string;
  unidadeEscolarId: string;
}

type UpdateCredentialsPayload = {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

type ActorUser = { id: string; papel?: string; instituicaoId?: string | null; unidadeEscolarId?: string | null };

export async function updateUserCredentials(
  id: string,
  payload: UpdateCredentialsPayload,
  where: Prisma.UsuariosWhereInput,
  actorUser?: ActorUser,
  prismaClient: PrismaTransactionClient = prisma
) {
  const { email, currentPassword, newPassword } = payload;

  return prismaClient.$transaction(async (tx) => {
    const usuario = await tx.usuarios.findFirst({
      where: { id, ...where },
      select: { id: true, senha_hash: true, email: true },
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado ou sem permissão para atualizar.");
    }

    if (newPassword) {
      if (!currentPassword) {
        throw new Error("Senha atual inválida.");
      }
      const match = await bcrypt.compare(currentPassword, usuario.senha_hash);
      if (!match) {
        throw new Error("Senha atual inválida.");
      }
    }

    const updateData: Prisma.UsuariosUpdateInput = {};
    if (email && email !== usuario.email) {
      updateData.email = email;
    }

    if (newPassword) {
      const senhaHash = await bcrypt.hash(newPassword, 10);
      updateData.senha_hash = senhaHash;
    }

    if (Object.keys(updateData).length === 0) {
      const { senha_hash, ...usuarioSemSenha } = usuario as any;
      return usuarioSemSenha;
    }
    const updated = await tx.usuarios.updateMany({
      where: { id, ...where },
      data: updateData,
    });

    if (updated.count === 0) {
      throw new Error("Usuário não encontrado ou sem permissão para atualizar.");
    }

    const finalUser = await tx.usuarios.findUniqueOrThrow({
      where: { id },
      include: { perfil_aluno: true, perfil_professor: true },
    });

    const { senha_hash, ...usuarioSemSenha } = finalUser as any;

    return usuarioSemSenha;
  });
}

export async function createUser(
  data: UserCreationData,
  prismaClient: PrismaTransactionClient = prisma
) {
  const {
    nome,
    email,
    senha,
    papel,
    perfil_aluno,
    perfil_professor,
    instituicaoId,
    unidadeEscolarId,
  } = data;
  const senhaHash = await bcrypt.hash(senha, 10);
  const novoUsuario = await prismaClient.usuarios.create({
    data: {
      nome,
      email,
      senha_hash: senhaHash,
      papel,
      status: true,
      instituicaoId,
      unidadeEscolarId,
    },
  });

  if (papel === "ALUNO" && perfil_aluno) {
    await prismaClient.usuarios_aluno.create({
      data: { usuarioId: novoUsuario.id, ...perfil_aluno },
    });
  } else if (papel === "PROFESSOR" && perfil_professor) {
    await prismaClient.usuarios_professor.create({
      data: { usuarioId: novoUsuario.id, ...perfil_professor },
    });
  }

  const usuarioCompleto = await prismaClient.usuarios.findUniqueOrThrow({
    where: { id: novoUsuario.id },
    include: { perfil_aluno: true, perfil_professor: true },
  });
  const { senha_hash, ...usuarioSemSenha } = usuarioCompleto;
  return usuarioSemSenha;
}

export async function findAllUsers(where: Prisma.UsuariosWhereInput) {
  return prisma.usuarios.findMany({
    where,
    select: { id: true, nome: true, email: true, papel: true, status: true },
    orderBy: { nome: "asc" },
  });
}

export async function findUserById(
  id: string,
  where: Prisma.UsuariosWhereInput
) {
  const usuario = await prisma.usuarios.findFirst({
    where: { id, ...where },
    include: { perfil_aluno: true, perfil_professor: true },
  });
  if (!usuario) return null;
  const { senha_hash, ...usuarioSemSenha } = usuario;
  return usuarioSemSenha;
}

export async function updateUser(
  id: string,
  data: Prisma.UsuariosUpdateInput & {
    perfil_professor?: { titulacao?: string; area_especializacao?: string };
  },
  where: Prisma.UsuariosWhereInput
) {
  const userExists = await prisma.usuarios.findFirst({
    where: { id, ...where },
    select: { perfil_professor: { select: { id: true } } },
  });

  if (!userExists) {
    throw new Error("Usuário não encontrado ou sem permissão para atualizar.");
  }

  const { perfil_professor, ...userData } = data;

  return prisma.$transaction(async (tx) => {
    await tx.usuarios.update({
      where: { id },
      data: userData,
    });

    if (perfil_professor && userExists.perfil_professor) {
      await tx.usuarios_professor.update({
        where: { id: userExists.perfil_professor.id },
        data: perfil_professor,
      });
    }

    const finalUser = await tx.usuarios.findUniqueOrThrow({
      where: { id },
      include: { perfil_aluno: true, perfil_professor: true },
    });

    const { senha_hash, ...usuarioSemSenha } = finalUser;
    return usuarioSemSenha;
  });
}

export async function deleteUser(id: string, where: Prisma.UsuariosWhereInput) {
  const userExists = await prisma.usuarios.findFirst({
    where: { id, ...where },
  });
  if (!userExists)
    throw new Error("Usuário não encontrado ou sem permissão para deletar.");

  await prisma.usuarios.delete({ where: { id } });
  return { message: "Usuário deletado com sucesso." };
}

