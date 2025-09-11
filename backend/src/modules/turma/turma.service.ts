import prisma from "../../utils/prisma";
import { CreateTurmaInput, UpdateTurmaInput } from "./turma.validator";

const validateTurmaDependencies = async (data: {
  instituicaoId: string;
  unidadeEscolarId?: string | null;
  professorId?: string | null;
}) => {
  const instituicao = await prisma.instituicao.findUnique({
    where: { id: data.instituicaoId },
  });
  if (!instituicao) throw new Error("Instituição não encontrada.");

  if (data.unidadeEscolarId) {
    const unidadeEscolar = await prisma.unidades_Escolares.findFirst({
      where: { id: data.unidadeEscolarId, instituicaoId: data.instituicaoId },
    });
    if (!unidadeEscolar)
      throw new Error(
        "Unidade Escolar inválida ou não pertence à instituição informada."
      );
  }

  if (data.professorId) {
    const professor = await prisma.usuarios.findFirst({
      where: {
        id: data.professorId,
        instituicaoId: data.instituicaoId,
        papel: "PROFESSOR",
      },
    });
    if (!professor)
      throw new Error(
        "Professor inválido, não encontrado ou não pertence à instituição."
      );
  }
};

export const turmaService = {
  create: async (data: CreateTurmaInput) => {
    await validateTurmaDependencies(data);
    return await prisma.turmas.create({ data });
  },

  findAll: async (filters: {
    instituicaoId?: string;
    unidadeEscolarId?: string;
    professorId?: string;
  }) => {
    return await prisma.turmas.findMany({
      where: filters,
      include: {
        professor: { select: { id: true, nome: true } },
        unidade_escolar: { select: { id: true, nome: true } },
      },
    });
  },

  findById: async (id: string) => {
    return await prisma.turmas.findUnique({
      where: { id },
      include: {
        instituicao: { select: { id: true, nome: true } },
        unidade_escolar: { select: { id: true, nome: true } },
        professor: { select: { id: true, nome: true, email: true } },
        _count: {
          select: { matriculas: true },
        },
      },
    });
  },

  update: async (id: string, data: UpdateTurmaInput) => {
    const turmaAtual = await prisma.turmas.findUnique({ where: { id } });
    if (!turmaAtual) throw new Error("Turma não encontrada.");

    await validateTurmaDependencies({
      instituicaoId: turmaAtual.instituicaoId,
      unidadeEscolarId: data.unidadeEscolarId,
      professorId: data.professorId,
    });

    return await prisma.turmas.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    return await prisma.turmas.delete({
      where: { id },
    });
  },
};
