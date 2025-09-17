import { Prisma, PrismaClient } from "@prisma/client";
import {
  CreateAvaliacaoInput,
  FindAllAvaliacoesInput,
} from "./avaliacaoParcial.validator";

const prisma = new PrismaClient();

const fullInclude = {
  matricula: {
    include: {
      aluno: { include: { usuario: { select: { id: true, nome: true } } } },
    },
  },
  componenteCurricular: { include: { materia: { select: { nome: true } } } },
};

async function verifyConsistencyAndOwnership(
  matriculaId: string,
  componenteCurricularId: string,
  professorId: string,
  instituicaoId: string
) {
  const [componente, matricula] = await Promise.all([
    prisma.componenteCurricular.findFirst({
      where: {
        id: componenteCurricularId,
        professorId,
        turma: { instituicaoId },
      },
    }),
    prisma.matriculas.findFirst({
      where: { id: matriculaId, turma: { instituicaoId } },
    }),
  ]);

  if (!componente || !matricula) {
    throw new Error(
      "Matrícula ou Componente Curricular não encontrado ou não pertence à sua instituição."
    );
  }

  if (componente.turmaId !== matricula.turmaId) {
    throw new Error(
      "Este aluno não pertence à turma deste componente curricular."
    );
  }
}

export async function create(
  data: CreateAvaliacaoInput,
  professorId: string,
  instituicaoId: string
) {
  await verifyConsistencyAndOwnership(
    data.matriculaId,
    data.componenteCurricularId,
    professorId,
    instituicaoId
  );
  return prisma.avaliacaoParcial.create({ data, include: fullInclude });
}

export async function findAll(
  instituicaoId: string,
  filters: FindAllAvaliacoesInput
) {
  const where: Prisma.AvaliacaoParcialWhereInput = {
    componenteCurricular: { turma: { instituicaoId } },
  };

  if (filters.matriculaId) where.matriculaId = filters.matriculaId;
  if (filters.componenteCurricularId)
    where.componenteCurricularId = filters.componenteCurricularId;

  return prisma.avaliacaoParcial.findMany({ where, include: fullInclude });
}

export async function findById(id: string, instituicaoId: string) {
  return prisma.avaliacaoParcial.findFirst({
    where: { id, componenteCurricular: { turma: { instituicaoId } } },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: Prisma.AvaliacaoParcialUpdateInput,
  professorId: string,
  instituicaoId: string
) {
  const avaliacao = await findById(id, instituicaoId);
  if (!avaliacao) {
    const error = new Error("Avaliação não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyConsistencyAndOwnership(
    avaliacao.matriculaId,
    avaliacao.componenteCurricularId,
    professorId,
    instituicaoId
  );
  return prisma.avaliacaoParcial.update({
    where: { id },
    data,
    include: fullInclude,
  });
}

export async function remove(
  id: string,
  professorId: string,
  instituicaoId: string
) {
  const avaliacao = await findById(id, instituicaoId);
  if (!avaliacao) {
    const error = new Error("Avaliação não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyConsistencyAndOwnership(
    avaliacao.matriculaId,
    avaliacao.componenteCurricularId,
    professorId,
    instituicaoId
  );
  return prisma.avaliacaoParcial.delete({ where: { id } });
}

export const avaliacaoService = { create, findAll, findById, update, remove };
