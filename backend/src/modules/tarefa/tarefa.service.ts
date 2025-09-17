import { Prisma, PrismaClient } from "@prisma/client";
import { CreateTarefaInput, FindAllTarefasInput } from "./tarefa.validator";

const prisma = new PrismaClient();

const fullInclude = {
  componenteCurricular: {
    include: {
      turma: { select: { nome: true, serie: true } },
      materia: { select: { nome: true } },
    },
  },
};

async function verifyOwnership(
  tarefaId: string,
  professorId: string,
  instituicaoId: string
) {
  const tarefa = await prisma.tarefas.findFirst({
    where: {
      id: tarefaId,
      instituicaoId,
    },
    select: {
      componenteCurricular: {
        select: {
          professorId: true,
        },
      },
    },
  });

  if (!tarefa || tarefa.componenteCurricular.professorId !== professorId) {
    const error = new Error(
      "Você não tem permissão para modificar esta tarefa."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }
}

export async function create(
  data: CreateTarefaInput,
  professorId: string,
  instituicaoId: string
) {
  const componente = await prisma.componenteCurricular.findFirst({
    where: { id: data.componenteCurricularId, professorId },
  });

  if (!componente) {
    const error = new Error(
      "Você não tem permissão para criar tarefas para este componente curricular."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  return prisma.tarefas.create({
    data: {
      ...data,
      instituicaoId,
    },
  });
}

export async function findAll(
  instituicaoId: string,
  filters: FindAllTarefasInput
) {
  const where: Prisma.TarefasWhereInput = { instituicaoId };

  if (filters.componenteCurricularId)
    where.componenteCurricularId = filters.componenteCurricularId;
  if (filters.publicado !== undefined)
    where.publicado = filters.publicado === "true";

  return prisma.tarefas.findMany({ where, include: fullInclude });
}

export async function findById(id: string, instituicaoId: string) {
  return prisma.tarefas.findFirst({
    where: { id, instituicaoId },
    include: {
      ...fullInclude,
      questoes: { orderBy: { sequencia: "asc" } },
    },
  });
}

export async function update(
  id: string,
  data: Prisma.TarefasUpdateInput,
  professorId: string,
  instituicaoId: string
) {
  await verifyOwnership(id, professorId, instituicaoId);
  return prisma.tarefas.update({ where: { id }, data });
}

export async function publish(
  id: string,
  publicado: boolean,
  professorId: string,
  instituicaoId: string
) {
  await verifyOwnership(id, professorId, instituicaoId);
  return prisma.tarefas.update({ where: { id }, data: { publicado } });
}

export async function remove(
  id: string,
  professorId: string,
  instituicaoId: string
) {
  await verifyOwnership(id, professorId, instituicaoId);
  return prisma.tarefas.delete({ where: { id } });
}

export const tarefaService = {
  create,
  findAll,
  findById,
  update,
  publish,
  remove,
};
