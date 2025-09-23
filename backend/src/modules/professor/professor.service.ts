import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const findAllPerfis = (instituicaoId: string) => {
  return prisma.usuarios_professor.findMany({
    where: { usuario: { instituicaoId: instituicaoId, status: true } },
    select: { id: true, usuario: { select: { nome: true } } },
    orderBy: { usuario: { nome: "asc" } },
  });
};
export const professorService = { findAllPerfis };
