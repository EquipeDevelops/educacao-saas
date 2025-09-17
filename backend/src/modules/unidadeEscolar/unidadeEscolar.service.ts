import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const unidadeEscolarService = {
  create: (
    data: Prisma.Unidades_EscolaresCreateWithoutInstituicaoInput,
    instituicaoId: string
  ) => prisma.unidades_Escolares.create({ data: { ...data, instituicaoId } }),

  findAll: (instituicaoId: string) =>
    prisma.unidades_Escolares.findMany({
      where: { instituicaoId },
      orderBy: { nome: "asc" },
    }),

  findById: (id: string, instituicaoId: string) =>
    prisma.unidades_Escolares.findFirst({ where: { id, instituicaoId } }),

  update: (
    id: string,
    data: Prisma.Unidades_EscolaresUpdateInput,
    instituicaoId: string
  ) =>
    prisma.unidades_Escolares.updateMany({
      where: { id, instituicaoId },
      data,
    }),

  remove: (id: string, instituicaoId: string) =>
    prisma.unidades_Escolares.deleteMany({ where: { id, instituicaoId } }),
};
