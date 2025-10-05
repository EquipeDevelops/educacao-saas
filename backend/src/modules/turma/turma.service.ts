import { Prisma, PrismaClient } from "@prisma/client";
import { CreateTurmaInput } from "./turma.validator";

const prisma = new PrismaClient();

// Agora as funções recebem 'unidadeEscolarId' para garantir o escopo correto
const create = (data: CreateTurmaInput, unidadeEscolarId: string) => {
  return prisma.turmas.create({
    data: {
      ...data,
      unidadeEscolarId, // Vincula a turma à escola do gestor
    },
  });
};

const findAll = (unidadeEscolarId: string) => {
  return prisma.turmas.findMany({
    where: { unidadeEscolarId },
    select: {
      id: true,
      nome: true,
      serie: true,
      turno: true,
    },
    orderBy: {
      serie: "asc",
    },
  });
};

const findById = (id: string, unidadeEscolarId: string) => {
  return prisma.turmas.findFirst({
    where: {
      id,
      unidadeEscolarId,
    },
  });
};

const update = (
  id: string,
  data: Prisma.TurmasUpdateInput,
  unidadeEscolarId: string
) => {
  return prisma.turmas.updateMany({
    where: {
      id,
      unidadeEscolarId,
    },
    data,
  });
};

const remove = (id: string, unidadeEscolarId: string) => {
  return prisma.turmas.deleteMany({
    where: {
      id,
      unidadeEscolarId,
    },
  });
};

export const turmaService = {
  create,
  findAll,
  findById,
  update,
  remove,
};
