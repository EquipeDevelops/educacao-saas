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

// *** FUNÇÃO DE VERIFICAÇÃO CORRIGIDA ***
// Agora verifica se a tarefa pertence ao professor, sem depender da unidade escolar do professor
async function verifyOwnership(tarefaId: string, professorId: string) {
  const tarefa = await prisma.tarefas.findFirst({
    where: {
      id: tarefaId,
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

// *** FUNÇÃO DE CRIAÇÃO CORRIGIDA ***
export async function create(data: CreateTarefaInput, professorId: string) {
  // Garante que o professor só pode criar tarefas em componentes que ele leciona
  const componente = await prisma.componenteCurricular.findFirst({
    where: {
      id: data.componenteCurricularId,
      professorId, // A única verificação necessária!
    },
    include: {
      turma: { select: { unidadeEscolarId: true } }, // Pega a unidade escolar do componente
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
      // Vincula a tarefa à unidade escolar CORRETA, vinda do componente
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

  // O escopo do aluno/gestor é a unidade escolar
  if (user.papel === "ALUNO" || user.papel === "GESTOR") {
    where.unidadeEscolarId = user.unidadeEscolarId;
  }

  if (filters.componenteCurricularId) {
    where.componenteCurricularId = filters.componenteCurricularId;
  }

  // Alunos só podem ver tarefas publicadas
  if (user.papel === "ALUNO") {
    where.publicado = true;
  }

  // Professores só veem tarefas dos seus componentes
  if (user.papel === "PROFESSOR") {
    where.componenteCurricular = { professorId: user.perfilId! };
  }

  return prisma.tarefas.findMany({ where, include: fullInclude });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  // A lógica de permissão para ver um item específico já está correta no componenteService
  // mas adicionamos uma camada extra aqui para tarefas
  const tarefa = await prisma.tarefas.findUnique({
    where: { id },
    include: fullInclude,
  });

  if (!tarefa) return null;

  // Se for professor, checa se é o dono
  if (
    user.papel === "PROFESSOR" &&
    tarefa.componenteCurricular.professorId !== user.perfilId
  ) {
    return null;
  }

  // Se for gestor ou aluno, checa se pertence à escola
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
  professorId: string
) {
  await verifyOwnership(id, professorId);
  return prisma.tarefas.update({ where: { id }, data });
}

export async function publish(
  id: string,
  publicado: boolean,
  professorId: string
) {
  await verifyOwnership(id, professorId);
  return prisma.tarefas.update({ where: { id }, data: { publicado } });
}

export async function remove(id: string, professorId: string) {
  await verifyOwnership(id, professorId);
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
