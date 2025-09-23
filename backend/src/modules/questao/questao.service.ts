// Caminho: backend/src/modules/questao/questao.service.ts
import { Prisma, PrismaClient } from "@prisma/client";
import { CreateQuestaoInput, FindAllQuestoesInput } from "./questao.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();
const fullInclude = {
  opcoes_multipla_escolha: { orderBy: { sequencia: "asc" } },
};

// A verificação de posse agora exige a unidade escolar
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
  return tarefa; // Retorna a tarefa para reutilização
}

export async function create(
  data: CreateQuestaoInput,
  user: AuthenticatedRequest["user"]
) {
  const { unidadeEscolarId, perfilId: professorId } = user;
  await verifyTarefaOwnership(data.tarefaId, professorId!, unidadeEscolarId!);

  return prisma.questoes.create({
    data: { ...data, unidadeEscolarId: unidadeEscolarId! },
  });
}

export async function findAllByTarefa(
  filters: FindAllQuestoesInput,
  user: AuthenticatedRequest["user"]
) {
  const tarefa = await prisma.tarefas.findFirst({
    where: { id: filters.tarefaId, unidadeEscolarId: user.unidadeEscolarId },
  });
  if (!tarefa) throw new Error("Tarefa não encontrada.");

  return prisma.questoes.findMany({
    where: { tarefaId: filters.tarefaId },
    orderBy: { sequencia: "asc" },
    include: fullInclude,
  });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  return prisma.questoes.findFirst({
    where: { id, unidadeEscolarId: user.unidadeEscolarId },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: Prisma.QuestoesUpdateInput,
  user: AuthenticatedRequest["user"]
) {
  const { unidadeEscolarId, perfilId: professorId } = user;
  const questao = await findById(id, user);
  if (!questao) {
    const error = new Error("Questão não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyTarefaOwnership(
    questao.tarefaId,
    professorId!,
    unidadeEscolarId!
  );
  return prisma.questoes.update({ where: { id }, data, include: fullInclude });
}

export async function remove(id: string, user: AuthenticatedRequest["user"]) {
  const { unidadeEscolarId, perfilId: professorId } = user;
  const questao = await findById(id, user);
  if (!questao) {
    const error = new Error("Questão não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyTarefaOwnership(
    questao.tarefaId,
    professorId!,
    unidadeEscolarId!
  );
  return prisma.questoes.delete({ where: { id } });
}

export const questaoService = {
  create,
  findAllByTarefa,
  findById,
  update,
  remove,
};
