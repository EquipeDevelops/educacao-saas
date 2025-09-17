import { Prisma, PrismaClient } from "@prisma/client";
import { CreateConquistaInput } from "./conquista.validator";

const prisma = new PrismaClient();

export async function create(
  data: CreateConquistaInput,
  instituicaoId: string
) {
  // SEGURANÇA: A conquista é criada com o ID da instituição do usuário logado.
  return prisma.conquistas.create({
    data: {
      ...data,
      instituicaoId,
    },
  });
}

export async function findAll(instituicaoId: string) {
  // SEGURANÇA: Retorna apenas as conquistas da instituição do usuário.
  return prisma.conquistas.findMany({
    where: { instituicaoId },
    orderBy: { titulo: "asc" },
  });
}

export async function findById(id: string, instituicaoId: string) {
  // SEGURANÇA: Garante que o usuário só pode acessar conquistas da sua própria instituição.
  return prisma.conquistas.findFirst({
    where: {
      id,
      instituicaoId,
    },
  });
}

export async function update(
  id: string,
  data: Prisma.ConquistasUpdateInput,
  instituicaoId: string
) {
  // SEGURANÇA: A verificação composta impede a atualização de dados de outra instituição.
  return prisma.conquistas.updateMany({
    where: {
      id,
      instituicaoId,
    },
    data,
  });
}

export async function remove(id: string, instituicaoId: string) {
  // SEGURANÇA: A verificação composta impede a exclusão de dados de outra instituição.
  return prisma.conquistas.deleteMany({
    where: {
      id,
      instituicaoId,
    },
  });
}

export const conquistaService = { create, findAll, findById, update, remove };
