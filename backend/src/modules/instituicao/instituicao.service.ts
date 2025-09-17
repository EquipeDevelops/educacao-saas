import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const instituicaoService = {
  create: (data: Prisma.InstituicaoCreateInput) =>
    prisma.instituicao.create({ data }),
  findAll: () => prisma.instituicao.findMany({ orderBy: { nome: "asc" } }),
  findById: (id: string) => prisma.instituicao.findUnique({ where: { id } }),
  update: (id: string, data: Prisma.InstituicaoUpdateInput) =>
    prisma.instituicao.update({ where: { id }, data }),
  remove: (id: string) => prisma.instituicao.delete({ where: { id } }),
};
