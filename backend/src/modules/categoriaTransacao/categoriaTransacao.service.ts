import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();
type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export const categoriaTransacaoService = {
  findAll: (user: AuthenticatedRequest["user"]) => {
    return prisma.categoriaTransacao.findMany({
      where: { unidadeEscolarId: user.unidadeEscolarId! },
      orderBy: { nome: "asc" },
    });
  },
  create: (
    data: any,
    user: AuthenticatedRequest["user"],
    prismaClient: PrismaTransactionClient = prisma
  ) => {
    return prismaClient.categoriaTransacao.create({
      data: {
        ...data,
        unidadeEscolarId: user.unidadeEscolarId!,
      },
    });
  },
  delete: (
    id: string,
    user: AuthenticatedRequest["user"],
    prismaClient: PrismaTransactionClient = prisma
  ) => {
    return prismaClient.categoriaTransacao.deleteMany({
      where: { id, unidadeEscolarId: user.unidadeEscolarId! },
    });
  },
};
