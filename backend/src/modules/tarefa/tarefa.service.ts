import prisma from "../../utils/prisma";
import { CreateTarefaInput, UpdateTarefaInput } from "./tarefa.validator";

export const tarefaService = {
  create: async (data: CreateTarefaInput) => {
    const [turma, professor] = await Promise.all([
      prisma.turmas.findUnique({ where: { id: data.turmaId } }),
      prisma.usuarios.findUnique({ where: { id: data.professorId } }),
    ]);

    if (!turma) throw new Error("Turma não encontrada.");
    if (!professor) throw new Error("Professor não encontrado.");
    if (professor.papel !== "PROFESSOR")
      throw new Error("O usuário informado não é um professor.");

    if (
      turma.instituicaoId !== data.instituicaoId ||
      professor.instituicaoId !== data.instituicaoId
    ) {
      throw new Error(
        "A turma e o professor devem pertencer à instituição informada."
      );
    }

    if (turma.professorId && turma.professorId !== data.professorId) {
      throw new Error(
        "Este professor não é o responsável pela turma informada."
      );
    }

    return await prisma.tarefas.create({ data });
  },

  findAll: async (filters: {
    instituicaoId?: string;
    turmaId?: string;
    professorId?: string;
  }) => {
    return await prisma.tarefas.findMany({
      where: filters,
      orderBy: { criado_em: "desc" },
      include: {
        turma: { select: { id: true, nome: true } },
        professor: { select: { id: true, nome: true } },
      },
    });
  },

  findById: async (id: string) => {
    return await prisma.tarefas.findUnique({
      where: { id },
      include: {
        turma: { select: { id: true, nome: true, serie: true } },
        professor: { select: { id: true, nome: true } },
        questoes: true,
        _count: {
          select: { submissoes: true },
        },
      },
    });
  },

  update: async (id: string, data: UpdateTarefaInput) => {
    return await prisma.tarefas.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    return await prisma.tarefas.delete({
      where: { id },
    });
  },
};
