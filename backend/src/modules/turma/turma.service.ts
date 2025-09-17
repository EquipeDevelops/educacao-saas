import { Prisma, PrismaClient } from "@prisma/client";
import { CreateTurmaInput } from "./turma.validator";

const prisma = new PrismaClient();

const create = (data: CreateTurmaInput, instituicaoId: string) => {
  return prisma.turmas.create({
    data: {
      ...data,
      instituicaoId,
    },
  });
};

const findAll = (instituicaoId: string) => {
  return prisma.turmas.findMany({
    where: { instituicaoId },
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

const findById = (id: string, instituicaoId: string) => {
  return prisma.turmas.findFirst({
    // Usando findFirst para um where mais complexo
    where: {
      id,
      instituicaoId,
    },
  });
};

const update = (
  id: string,
  data: Prisma.TurmasUpdateInput,
  instituicaoId: string
) => {
  return prisma.turmas.updateMany({
    // Usando updateMany para um where mais complexo
    where: {
      id,
      instituicaoId,
    },
    data,
  });
};

const remove = (id: string, instituicaoId: string) => {
  return prisma.turmas.deleteMany({
    // Usando deleteMany para um where mais complexo
    where: {
      id,
      instituicaoId,
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
