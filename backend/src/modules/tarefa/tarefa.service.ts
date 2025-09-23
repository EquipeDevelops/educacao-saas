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

// A verificação de posse agora também checa a unidade escolar
async function verifyOwnership(
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
      "Você não tem permissão para modificar esta tarefa."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }
}

export async function create(
  data: CreateTarefaInput,
  professorId: string,
  unidadeEscolarId: string
) {
  // Garante que o professor só pode criar tarefas em componentes que ele leciona
  const componente = await prisma.componenteCurricular.findFirst({
    where: {
      id: data.componenteCurricularId,
      professorId,
      turma: { unidadeEscolarId }, // Garante que o componente é do colégio certo
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
      unidadeEscolarId, // Vincula a tarefa ao colégio
    },
    include: fullInclude,
  });
}

export async function findAll(
  user: AuthenticatedRequest["user"],
  filters: FindAllTarefasInput
) {
  const where: Prisma.TarefasWhereInput = {
    unidadeEscolarId: user.unidadeEscolarId,
  };

  if (filters.componenteCurricularId) {
    where.componenteCurricularId = filters.componenteCurricularId;
  }

  // Alunos só podem ver tarefas publicadas
  if (user.papel === "ALUNO") {
    where.publicado = true;
  }

  return prisma.tarefas.findMany({ where, include: fullInclude });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  return prisma.tarefas.findFirst({
    where: { id, unidadeEscolarId: user.unidadeEscolarId },
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
  unidadeEscolarId: string
) {
  await verifyOwnership(id, professorId, unidadeEscolarId);
  return prisma.tarefas.update({ where: { id }, data });
}

export async function publish(
  id: string,
  publicado: boolean,
  professorId: string,
  unidadeEscolarId: string
) {
  await verifyOwnership(id, professorId, unidadeEscolarId);
  return prisma.tarefas.update({ where: { id }, data: { publicado } });
}

export async function remove(
  id: string,
  professorId: string,
  unidadeEscolarId: string
) {
  await verifyOwnership(id, professorId, unidadeEscolarId);
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
