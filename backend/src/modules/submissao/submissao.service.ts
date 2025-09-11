import prisma from "../../utils/prisma";
import {
  CreateSubmissaoInput,
  GradeSubmissaoInput,
} from "./submissao.validator";

export const submissaoService = {
  create: async (data: CreateSubmissaoInput) => {
    const [aluno, tarefa] = await Promise.all([
      prisma.usuarios.findUnique({ where: { id: data.alunoId } }),
      prisma.tarefas.findUnique({
        where: { id: data.tarefaId },
        include: { turma: true },
      }),
    ]);

    if (!aluno || aluno.papel !== "ALUNO") throw new Error("Aluno inválido.");
    if (!tarefa) throw new Error("Tarefa não encontrada.");

    const matricula = await prisma.matriculas.findFirst({
      where: { alunoId: data.alunoId, turmaId: tarefa.turmaId, status: true },
    });
    if (!matricula)
      throw new Error("Aluno não está matriculado na turma desta tarefa.");

    const submissaoExistente = await prisma.submissoes.findFirst({
      where: data,
    });
    if (submissaoExistente)
      throw new Error(
        "Já existe uma submissão para esta tarefa por este aluno."
      );

    return await prisma.submissoes.create({
      data: {
        ...data,
        instituicaoId: tarefa.instituicaoId,
        status: "ENTREGUE",
        nota_total: 0,
      },
    });
  },

  grade: async (id: string, data: GradeSubmissaoInput) => {
    return await prisma.submissoes.update({ where: { id }, data });
  },

  findAll: async (filters: { tarefaId?: string; alunoId?: string }) => {
    return await prisma.submissoes.findMany({
      where: filters,
      include: {
        aluno: { select: { id: true, nome: true } },
      },
    });
  },

  findById: async (id: string) => {
    return await prisma.submissoes.findUnique({
      where: { id },
      include: {
        aluno: { select: { id: true, nome: true } },
        tarefa: { select: { id: true, titulo: true } },
        respostas: {
          include: {
            questao: { select: { id: true, titulo: true, sequencia: true } },
          },
        },
      },
    });
  },
};
