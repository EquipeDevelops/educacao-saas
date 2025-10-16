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
    select: {
      id: true,
      nome: true,
      codigo: true,
      _count: {
        select: { componentes_curriculares: true },
      },
    },
    orderBy: {
      nome: "asc",
    },
  });
};

const update = (
  id: string,
  data: Prisma.MateriasUpdateInput,
  unidadeEscolarId: string
) => {
  console.log(`[MateriaService] Atualizando matéria ID: ${id}`);
  return prisma.materias.updateMany({
    where: {
      id,
      unidadeEscolarId,
    },
    data,
  });
};

const remove = async (id: string, unidadeEscolarId: string) => {
  console.log(
    `[MateriaService] Iniciando processo de remoção para matéria ID: ${id}`
  );

  const materiaExists = await prisma.materias.findFirst({
    where: { id, unidadeEscolarId },
  });

  if (!materiaExists) {
    console.warn(
      `[MateriaService] Matéria ID: ${id} não encontrada na unidade escolar ${unidadeEscolarId}.`
    );
    return { count: 0 };
  }

  console.log(
    `[MateriaService] Matéria ${id} encontrada. Iniciando transação para deletar dependências.`
  );

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Deleta todos os Componentes Curriculares (Vínculos) que usam esta matéria.
      // Esta é a principal causa do erro 500.
      console.log(
        `[MateriaService] Deletando componentes curriculares associados à matéria ${id}...`
      );
      await tx.componenteCurricular.deleteMany({ where: { materiaId: id } });

      // 2. Finalmente, deleta a matéria.
      console.log(`[MateriaService] Deletando a matéria ${id}...`);
      await tx.materias.delete({ where: { id } });
    });

    console.log(
      `[MateriaService] Transação concluída com sucesso para a matéria ${id}.`
    );
    return { count: 1 };
  } catch (error) {
    console.error(
      `[MateriaService] ERRO na transação de exclusão da matéria ${id}:`,
      error
    );
    throw error;
  }
};

export const materiaService = {
  create,
  findAll,
  update,
  remove,
};
