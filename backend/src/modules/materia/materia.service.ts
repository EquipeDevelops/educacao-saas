import { Prisma, PrismaClient } from "@prisma/client";
import { CreateMateriaInput } from "./materia.validator";


const prisma = new PrismaClient();

const create = (data: CreateMateriaInput, unidadeEscolarId: string) => {
  return prisma.materias.create({
    data: {
      ...data,
      unidadeEscolarId,
    },
  });
};

const findAll = (unidadeEscolarId: string) => {
  return prisma.materias.findMany({
    where: { unidadeEscolarId },
    orderBy: { nome: "asc" },
  });
};

const findById = (id: string, unidadeEscolarId: string) => {
  return prisma.materias.findFirst({
    where: { id, unidadeEscolarId },
  });
};

const update = (
  id: string,
  data: Prisma.MateriasUpdateInput,
  unidadeEscolarId: string
) => {
  return prisma.materias.updateMany({
    where: { id, unidadeEscolarId },
    data,
  });
};


const remove = (id: string, unidadeEscolarId: string) => {
  return prisma.materias.deleteMany({
    where: { 
        // REVERTER PARA O USO DE STRINGS
        id: id, // <== Deve ser string pura
        unidadeEscolarId: unidadeEscolarId // <== Deve ser string pura
    },
  });
};
export const materiaService = { create, findAll, findById, update, remove };
