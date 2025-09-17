import { Prisma, PrismaClient } from "@prisma/client";
import { CreateMateriaInput } from "./materia.validator";

const prisma = new PrismaClient();

const create = (data: CreateMateriaInput, instituicaoId: string) => {
  // SEGURANÇA: A matéria é criada com o ID da instituição do usuário logado.
  return prisma.materias.create({
    data: {
      ...data,
      instituicaoId,
    },
  });
};

const findAll = (instituicaoId: string) => {
  // LGPD & OTIMIZAÇÃO: Selecionamos apenas os campos necessários.
  // SEGURANÇA: Filtra apenas as matérias da instituição do usuário.
  return prisma.materias.findMany({
    where: { instituicaoId },
    select: {
      id: true,
      nome: true,
      codigo: true,
    },
    orderBy: {
      nome: "asc",
    },
  });
};

const findById = (id: string, instituicaoId: string) => {
  // SEGURANÇA: Garante que o usuário só pode acessar matérias da sua própria instituição.
  return prisma.materias.findFirst({
    where: {
      id,
      instituicaoId,
    },
  });
};

const update = (
  id: string,
  data: Prisma.MateriasUpdateInput,
  instituicaoId: string
) => {
  // SEGURANÇA: A verificação composta impede a atualização de dados de outra instituição.
  return prisma.materias.updateMany({
    where: {
      id,
      instituicaoId,
    },
    data,
  });
};

const remove = (id: string, instituicaoId: string) => {
  // SEGURANÇA: A verificação composta impede a exclusão de dados de outra instituição.
  return prisma.materias.deleteMany({
    where: {
      id,
      instituicaoId,
    },
  });
};

export const materiaService = {
  create,
  findAll,
  findById,
  update,
  remove,
};
