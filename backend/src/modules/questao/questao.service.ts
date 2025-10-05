import { Prisma, PrismaClient } from "@prisma/client";
import { CreateQuestaoInput, FindAllQuestoesInput } from "./questao.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();
const fullInclude = {
  opcoes_multipla_escolha: { orderBy: { sequencia: "asc" } },
};

async function verifyTarefaOwnership(
  tarefaId: string,
  professorId: string,
  unidadeEscolarId: string
) {
  const tarefa = await prisma.tarefas.findFirst({
    where: {
      id: tarefaId,
      unidadeEscolarId,
      componenteCurricular: { professorId },
    },
  });

  if (!tarefa) {
    const error = new Error(
      "Você não tem permissão para gerenciar questões nesta tarefa."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }
  return tarefa;
}

export async function create(
  data: CreateQuestaoInput,
  user: AuthenticatedRequest["user"]
) {
  const { unidadeEscolarId, perfilId: professorId } = user;

  if (!professorId || !unidadeEscolarId) {
    const error = new Error(
      "Professor não autenticado ou sem vínculo escolar."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  await verifyTarefaOwnership(data.tarefaId, professorId, unidadeEscolarId);

  return prisma.questoes.create({
    data: { ...data, unidadeEscolarId },
  });
}

export async function findAllByTarefa(
  filters: FindAllQuestoesInput,
  user: AuthenticatedRequest["user"]
) {
  const { unidadeEscolarId } = user;
  if (!unidadeEscolarId) {
    throw new Error("Usuário sem vínculo escolar para buscar questões.");
  }

  const tarefa = await prisma.tarefas.findFirst({
    where: { id: filters.tarefaId, unidadeEscolarId },
  });
  if (!tarefa) throw new Error("Tarefa não encontrada.");

  return prisma.questoes.findMany({
    where: { tarefaId: filters.tarefaId },
    orderBy: { sequencia: "asc" },
    include: fullInclude,
  });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  const { unidadeEscolarId } = user;
  if (!unidadeEscolarId) {
    return null;
  }

  return prisma.questoes.findFirst({
    where: { id, unidadeEscolarId },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: Prisma.QuestoesUpdateInput,
  user: AuthenticatedRequest["user"]
) {
  const { unidadeEscolarId, perfilId: professorId } = user;
  if (!professorId || !unidadeEscolarId) {
    const error = new Error(
      "Professor não autenticado ou sem vínculo escolar."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  const questao = await findById(id, user);
  if (!questao) {
    const error = new Error("Questão não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }

  await verifyTarefaOwnership(questao.tarefaId, professorId, unidadeEscolarId);
  return prisma.questoes.update({ where: { id }, data, include: fullInclude });
}

export async function remove(id: string, user: AuthenticatedRequest["user"]) {
  const { unidadeEscolarId, perfilId: professorId } = user;
  if (!professorId || !unidadeEscolarId) {
    const error = new Error(
      "Professor não autenticado ou sem vínculo escolar."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  const questao = await findById(id, user);
  if (!questao) {
    const error = new Error("Questão não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }

  await verifyTarefaOwnership(questao.tarefaId, professorId, unidadeEscolarId);

  return prisma.$transaction(async (tx) => {
    await tx.respostas_Submissao.deleteMany({ where: { questaoId: id } });

    await tx.opcoes_Multipla_Escolha.deleteMany({ where: { questaoId: id } });

    return await tx.questoes.delete({ where: { id } });
  });
}

export const questaoService = {
  create,
  findAllByTarefa,
  findById,
  update,
  remove,
};
