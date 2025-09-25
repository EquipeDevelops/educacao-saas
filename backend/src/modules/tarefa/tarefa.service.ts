import { Prisma, PrismaClient } from "@prisma/client";
import { CreateTarefaInput, FindAllTarefasInput } from "./tarefa.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

const fullInclude = {
  componenteCurricular: {
    include: {
      turma: { select: { nome: true, serie: true } },
      materia: { select: { nome: true } },
    },
  },
};

async function verifyOwnership(tarefaId: string, professorId: string) {
  const tarefa = await prisma.tarefas.findUnique({
    where: { id: tarefaId },
    select: {
      componenteCurricular: { select: { professorId: true } },
    },
  });

  if (!tarefa) {
    const error = new Error("Tarefa não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }

  if (tarefa.componenteCurricular.professorId !== professorId) {
    const error = new Error(
      "Você não tem permissão para modificar esta tarefa."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }
}

export async function create(
  data: CreateTarefaInput,
  user: AuthenticatedRequest["user"]
) {
  if (!user.perfilId) {
    const error = new Error("Professor não autenticado corretamente.");
    (error as any).code = "FORBIDDEN";
    throw error;
  }
  const professorId = user.perfilId;

  const componente = await prisma.componenteCurricular.findFirst({
    where: {
      id: data.componenteCurricularId,
      professorId,
    },
    include: {
      turma: { select: { unidadeEscolarId: true } },
    },
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
      unidadeEscolarId: componente.turma.unidadeEscolarId,
    },
    include: fullInclude,
  });
}

export async function findAll(
  user: AuthenticatedRequest["user"],
  filters: FindAllTarefasInput
) {
  const where: Prisma.TarefasWhereInput = {};

  if (user.papel === "ALUNO" || user.papel === "GESTOR") {
    where.unidadeEscolarId = user.unidadeEscolarId;
  }

  if (filters.componenteCurricularId) {
    where.componenteCurricularId = filters.componenteCurricularId;
  }

  if (user.papel === "ALUNO") {
    where.publicado = true;
  }

  if (user.papel === "PROFESSOR") {
    where.componenteCurricular = { professorId: user.perfilId! };
  }

  return prisma.tarefas.findMany({ where, include: fullInclude });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  const tarefa = await prisma.tarefas.findUnique({
    where: { id },
    include: fullInclude,
  });

  if (!tarefa) return null;

  if (
    user.papel === "PROFESSOR" &&
    tarefa.componenteCurricular.professorId !== user.perfilId
  ) {
    return null;
  }

  if (
    (user.papel === "GESTOR" || user.papel === "ALUNO") &&
    tarefa.unidadeEscolarId !== user.unidadeEscolarId
  ) {
    return null;
  }

  return tarefa;
}

export async function update(
  id: string,
  data: Prisma.TarefasUpdateInput,
  user: AuthenticatedRequest["user"]
) {
  if (!user.perfilId) {
    const error = new Error("Professor não autenticado corretamente.");
    (error as any).code = "FORBIDDEN";
    throw error;
  }
  await verifyOwnership(id, user.perfilId);
  return prisma.tarefas.update({ where: { id }, data });
}

export async function publish(
  id: string,
  publicado: boolean,
  user: AuthenticatedRequest["user"]
) {
  if (!user.perfilId) {
    const error = new Error("Professor não autenticado corretamente.");
    (error as any).code = "FORBIDDEN";
    throw error;
  }
  await verifyOwnership(id, user.perfilId);
  return prisma.tarefas.update({ where: { id }, data: { publicado } });
}

export async function remove(id: string, user: AuthenticatedRequest["user"]) {
  console.log("[DEBUG] Tentando deletar tarefa com ID:", id);

  if (!user.perfilId) {
    const error = new Error("Professor não autenticado corretamente.");
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  await verifyOwnership(id, user.perfilId);
  console.log("[DEBUG] Ownership verificada com sucesso");

  try {
    const result = await prisma.tarefas.delete({
      where: { id },
    });

    console.log("[DEBUG] Tarefa deletada com sucesso via cascade");
    return result;
  } catch (error) {
    console.log("[DEBUG] Erro ao deletar tarefa:", error);
    throw error;
  }
}

export const tarefaService = {
  create,
  findAll,
  findById,
  update,
  publish,
  remove,
};
