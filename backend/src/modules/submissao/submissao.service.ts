import { Prisma, PrismaClient, StatusSubmissao } from "@prisma/client";
import {
  CreateSubmissaoInput,
  GradeSubmissaoInput,
  FindAllSubmissoesInput,
} from "./submissao.validator";

const prisma = new PrismaClient();

const fullInclude = {
  aluno: { include: { usuario: { select: { id: true, nome: true } } } },
  tarefa: { select: { id: true, titulo: true, pontos: true } },
  respostas: true,
};

export async function create(
  data: CreateSubmissaoInput,
  user: AuthenticatedRequest["user"]
) {
  const { tarefaId } = data;
  const { perfilId: alunoId, unidadeEscolarId } = user;

  const tarefa = await prisma.tarefas.findFirst({
    where: { id: tarefaId, unidadeEscolarId, publicado: true },
    select: { componenteCurricular: { select: { turmaId: true } } },
  });
  if (!tarefa) {
    throw new Error(
      "Tarefa não encontrada ou não está disponível em sua unidade escolar."
    );
  }

  const matricula = await prisma.matriculas.findFirst({
    where: {
      alunoId: alunoId!,
      turmaId: tarefa.componenteCurricular.turmaId,
      status: "ATIVA",
    },
  });
  if (!matricula) {
    throw new Error("Você não está matriculado na turma desta tarefa.");
  }

  const submissaoExistente = await prisma.submissoes.findFirst({
    where: { tarefaId, alunoId: alunoId! },
  });
  if (submissaoExistente) {
    throw new Error("Já existe uma submissão para esta tarefa.");
  }

  return prisma.submissoes.create({
    data: {
      tarefaId,
      alunoId: alunoId!,
      unidadeEscolarId: unidadeEscolarId!,
      status: StatusSubmissao.EM_ANDAMENTO,
    },
  });
}

export async function findAll(
  user: AuthenticatedRequest["user"],
  filters: FindAllSubmissoesInput
) {
  const where: Prisma.SubmissoesWhereInput = {
    unidadeEscolarId: user.unidadeEscolarId,
  };

  if (user.papel === "ALUNO") {
    filters.alunoId = user.perfilId!;
  }

  if (filters.tarefaId) where.tarefaId = filters.tarefaId;
  if (filters.alunoId) where.alunoId = filters.alunoId;

  return prisma.submissoes.findMany({
    where,
    include: {
      aluno: { include: { usuario: { select: { nome: true } } } },
      tarefa: { select: { titulo: true } },
    },
  });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  const submissao = await prisma.submissoes.findFirst({
    where: { id, unidadeEscolarId: user.unidadeEscolarId },
    include: fullInclude,
  });

  if (!submissao) return null;

  const isOwner = submissao.alunoId === user.perfilId;
  const professorDaTarefa = await prisma.tarefas.findFirst({
    where: {
      id: submissao.tarefaId,
      componenteCurricular: { professorId: user.perfilId },
    },
  });
  const isProfessorDaTarefa = !!professorDaTarefa;
  const isGestorDaEscola =
    user.papel === "GESTOR" &&
    user.unidadeEscolarId === submissao.unidadeEscolarId;

  if (user.papel === "ALUNO" && !isOwner) return null;
  if (user.papel === "PROFESSOR" && !isProfessorDaTarefa) return null;
  if (user.papel === "ADMINISTRADOR") return null;
  if (isGestorDaEscola || isOwner || isProfessorDaTarefa) return submissao;

  return null;
}

export async function grade(
  id: string,
  data: GradeSubmissaoInput,
  user: AuthenticatedRequest["user"]
) {
  const { perfilId: professorId, unidadeEscolarId } = user;

  const submissao = await prisma.submissoes.findFirst({
    where: { id, unidadeEscolarId },
  });
  if (!submissao) throw new Error("Submissão não encontrada.");

  const tarefa = await prisma.tarefas.findFirst({
    where: { id: submissao.tarefaId, componenteCurricular: { professorId } },
  });
  if (!tarefa) {
    throw new Error("Você não tem permissão para avaliar esta submissão.");
  }

  return prisma.submissoes.update({
    where: { id },
    data: {
      ...data,
      status: StatusSubmissao.AVALIADA,
    },
    include: fullInclude,
  });
}

export const submissaoService = { create, findAll, findById, grade };
