import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CreateUserInput } from "./usuario.validator";

const prisma = new PrismaClient();

export async function createUser(input: CreateUserInput) {
  const { nome, email, senha, papel, perfil_aluno, perfil_professor } = input;

  const senhaHash = await bcrypt.hash(senha, 10);

  return prisma.$transaction(async (tx) => {
    const novoUsuario = await tx.usuarios.create({
      data: {
        nome,
        email,
        senha_hash: senhaHash,
        papel,
        status: true,
      },
    });

    if (papel === "ALUNO" && perfil_aluno) {
      await tx.usuarios_aluno.create({
        data: {
          usuarioId: novoUsuario.id,
          numero_matricula: perfil_aluno.numero_matricula,
          email_responsavel: perfil_aluno.email_responsavel,
        },
      });
    } else if (papel === "PROFESSOR" && perfil_professor) {
      await tx.usuarios_professor.create({
        data: {
          usuarioId: novoUsuario.id,
          titulacao: perfil_professor.titulacao,
          area_especializacao: perfil_professor.area_especializacao,
        },
      });
    }

    const usuarioCompleto = await tx.usuarios.findUnique({
      where: { id: novoUsuario.id },
      include: {
        perfil_aluno: true,
        perfil_professor: true,
      },
    });

    const { senha_hash, ...usuarioSemSenha } = usuarioCompleto!;
    return usuarioSemSenha;
  });
}

export async function findUserById(id: string) {
  const usuario = await prisma.usuarios.findUnique({
    where: { id },
    include: {
      perfil_aluno: true,
      perfil_professor: true,
    },
  });

  if (!usuario) return null;

  const { senha_hash, ...usuarioSemSenha } = usuario;
  return usuarioSemSenha;
}

export async function findAllUsers() {
  const usuarios = await prisma.usuarios.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      papel: true,
      status: true,
      criado_em: true,
    },
  });
  return usuarios;
}

export async function updateUser(id: string, data: Prisma.UsuariosUpdateInput) {
  const usuarioAtualizado = await prisma.usuarios.update({
    where: { id },
    data,
  });
  const { senha_hash, ...usuarioSemSenha } = usuarioAtualizado;
  return usuarioSemSenha;
}

export async function deleteUser(id: string) {
  await prisma.usuarios.delete({
    where: { id },
  });
  return { message: "Usuário deletado com sucesso." };
}
