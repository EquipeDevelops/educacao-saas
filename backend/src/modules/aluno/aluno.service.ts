import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const findAllPerfis = (unidadeEscolarId: string) => {
  return prisma.usuarios_aluno.findMany({
    where: { usuario: { unidadeEscolarId: unidadeEscolarId, status: true } },
    select: {
      id: true,
      numero_matricula: true,
      usuario: { select: { nome: true } },
    },
    orderBy: { usuario: { nome: "asc" } },
  });
};
export const alunoService = { findAllPerfis };
