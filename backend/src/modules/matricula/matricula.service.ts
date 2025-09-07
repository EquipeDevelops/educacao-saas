import prisma from "../../utils/prisma";
import {
  CreateMatriculaInput,
  UpdateMatriculaInput,
} from "./matricula.validator";

export const matriculaService = {
  create: async (data: CreateMatriculaInput) => {
    const [aluno, turma] = await Promise.all([
      prisma.usuarios.findUnique({ where: { id: data.alunoId } }),
      prisma.turmas.findUnique({ where: { id: data.turmaId } }),
    ]);

    if (!aluno) throw new Error("Aluno não encontrado.");
    if (!turma) throw new Error("Turma não encontrada.");

    if (aluno.papel !== "ALUNO")
      throw new Error("O usuário informado não é um aluno.");

    if (aluno.instituicaoId !== turma.instituicaoId) {
      throw new Error("O aluno e a turma não pertencem à mesma instituição.");
    }

    const matriculaExistente = await prisma.matriculas.findFirst({
      where: {
        alunoId: data.alunoId,
        turmaId: data.turmaId,
      },
    });

    if (matriculaExistente) {
      throw new Error("Este aluno já está matriculado nesta turma.");
    }

    return await prisma.matriculas.create({ data });
  },

  findAll: async (filters: { turmaId?: string; alunoId?: string }) => {
    return await prisma.matriculas.findMany({
      where: filters,
      include: {
        aluno: { select: { id: true, nome: true, email: true } },
        turma: { select: { id: true, nome: true, serie: true } },
      },
    });
  },

  findById: async (id: string) => {
    return await prisma.matriculas.findUnique({
      where: { id },
      include: {
        aluno: { select: { id: true, nome: true } },
        turma: {
          select: {
            id: true,
            nome: true,
            serie: true,
            instituicao: { select: { id: true, nome: true } },
          },
        },
      },
    });
  },

  update: async (id: string, data: UpdateMatriculaInput) => {
    return await prisma.matriculas.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    return await prisma.matriculas.delete({
      where: { id },
    });
  },
};
