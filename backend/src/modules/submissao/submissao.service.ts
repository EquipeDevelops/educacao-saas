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
  alunoId: string,
  instituicaoId: string
) {
  const { tarefaId } = data;

  const tarefa = await prisma.tarefas.findFirst({
    where: { id: tarefaId, instituicaoId, publicado: true },
    select: { componenteCurricular: { select: { turmaId: true } } },
  });
  if (!tarefa) throw new Error("Tarefa não encontrada ou não está disponível.");

  const matricula = await prisma.matriculas.findFirst({
    where: {
      alunoId,
      turmaId: tarefa.componenteCurricular.turmaId,
      status: "ATIVA",
    },
  });
  if (!matricula)
    throw new Error("Você não está matriculado na turma desta tarefa.");

  const submissaoExistente = await prisma.submissoes.findFirst({
    where: { tarefaId, alunoId },
  });
  if (submissaoExistente)
    throw new Error("Já existe uma submissão para esta tarefa.");

  return prisma.submissoes.create({
    data: {
      tarefaId,
      alunoId,
      instituicaoId,
      status: StatusSubmissao.EM_ANDAMENTO,
    },
  });
}

export async function findAll(
  instituicaoId: string,
  filters: FindAllSubmissoesInput
) {
  const where: Prisma.SubmissoesWhereInput = { instituicaoId };
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

export async function findById(
  id: string,
  user: { instituicaoId: string; perfilId: string; papel: string }
) {
  const submissao = await prisma.submissoes.findFirst({
    where: { id, instituicaoId: user.instituicaoId },
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

  if (user.papel === "ALUNO" && !isOwner) return null;
  if (user.papel === "PROFESSOR" && !isProfessorDaTarefa) return null;

  return submissao;
}

export async function grade(
  id: string,
  data: GradeSubmissaoInput,
  professorId: string,
  instituicaoId: string
) {
  const submissao = await prisma.submissoes.findFirst({
    where: { id, instituicaoId },
  });
  if (!submissao) throw new Error("Submissão não encontrada.");

  const tarefa = await prisma.tarefas.findFirst({
    where: { id: submissao.tarefaId, componenteCurricular: { professorId } },
  });
  if (!tarefa)
    throw new Error("Você não tem permissão para avaliar esta submissão.");

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
