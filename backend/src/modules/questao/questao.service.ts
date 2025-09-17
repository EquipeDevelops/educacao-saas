import { Prisma, PrismaClient } from "@prisma/client";
import { CreateQuestaoInput, FindAllQuestoesInput } from "./questao.validator";

const prisma = new PrismaClient();

const fullInclude = {
  opcoes_multipla_escolha: { orderBy: { sequencia: "asc" } },
};

async function verifyTarefaOwnership(
  tarefaId: string,
  professorId: string,
  instituicaoId: string
) {
  const tarefa = await prisma.tarefas.findFirst({
    where: {
      id: tarefaId,
      instituicaoId,
    },
    select: { componenteCurricular: { select: { professorId: true } } },
  });

  if (!tarefa || tarefa.componenteCurricular.professorId !== professorId) {
    const error = new Error(
      "Você não tem permissão para gerenciar questões nesta tarefa."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }
}

export async function create(
  data: CreateQuestaoInput,
  professorId: string,
  instituicaoId: string
) {
  await verifyTarefaOwnership(data.tarefaId, professorId, instituicaoId);

  return prisma.questoes.create({
    data: {
      ...data,
      instituicaoId,
    },
  });
}

export async function findAllByTarefa(
  filters: FindAllQuestoesInput,
  instituicaoId: string
) {
  const tarefa = await prisma.tarefas.findFirst({
    where: { id: filters.tarefaId, instituicaoId },
  });
  if (!tarefa) throw new Error("Tarefa não encontrada.");

  return prisma.questoes.findMany({
    where: { tarefaId: filters.tarefaId },
    orderBy: { sequencia: "asc" },
    include: fullInclude,
  });
}

export async function findById(id: string, instituicaoId: string) {
  return prisma.questoes.findFirst({
    where: { id, instituicaoId },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: Prisma.QuestoesUpdateInput,
  professorId: string,
  instituicaoId: string
) {
  const questao = await findById(id, instituicaoId);
  if (!questao) {
    const error = new Error("Questão não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }

  await verifyTarefaOwnership(questao.tarefaId, professorId, instituicaoId);

  return prisma.questoes.update({ where: { id }, data, include: fullInclude });
}

export async function remove(
  id: string,
  professorId: string,
  instituicaoId: string
) {
  const questao = await findById(id, instituicaoId);
  if (!questao) {
    const error = new Error("Questão não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }

  await verifyTarefaOwnership(questao.tarefaId, professorId, instituicaoId);

  return prisma.questoes.delete({ where: { id } });
}

export const questaoService = {
  create,
  findAllByTarefa,
  findById,
  update,
  remove,
};
