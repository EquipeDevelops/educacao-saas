import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function findAll(instituicaoId: string, unidadeEscolarId: string) {
  const [todasAsConquistas, conquistasAtivas] = await Promise.all([
    prisma.conquistas.findMany({ where: { instituicaoId } }),
    prisma.conquistasPorUnidade.findMany({
      where: { unidadeEscolarId },
      select: { conquistaId: true },
    }),
  ]);
  const mapaAtivas = new Set(conquistasAtivas.map((c) => c.conquistaId));
  return todasAsConquistas.map((conquista) => ({
    ...conquista,
    ativo: mapaAtivas.has(conquista.id),
  }));
}

async function toggle(
  conquistaId: string,
  ativo: boolean,
  unidadeEscolarId: string
) {
  if (ativo) {
    return prisma.conquistasPorUnidade.create({
      data: { conquistaId, unidadeEscolarId },
    });
  } else {
    return prisma.conquistasPorUnidade.deleteMany({
      where: { conquistaId, unidadeEscolarId },
    });
  }
}
export const conquistasPorUnidadeService = { findAll, toggle };
