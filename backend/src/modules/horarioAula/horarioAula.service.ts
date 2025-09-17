import { Prisma, PrismaClient } from "@prisma/client";
import {
  CreateHorarioInput,
  FindAllHorariosInput,
} from "./horarioAula.validator";

const prisma = new PrismaClient();

const fullInclude = {
  turma: { select: { id: true, nome: true } },
  componenteCurricular: {
    include: {
      materia: { select: { nome: true } },
      professor: { include: { usuario: { select: { nome: true } } } },
    },
  },
};

// SEGURANÇA E REGRA DE NEGÓCIO: Valida se o componente pertence à turma informada.
async function verifyConsistency(
  turmaId: string,
  componenteCurricularId: string,
  instituicaoId: string
) {
  const componente = await prisma.componenteCurricular.findFirst({
    where: {
      id: componenteCurricularId,
      turma: { instituicaoId }, // Garante que o componente é da instituição
    },
  });

  if (!componente)
    throw new Error("Componente curricular não encontrado na sua instituição.");
  if (componente.turmaId !== turmaId)
    throw new Error(
      "Este componente curricular não pertence à turma informada."
    );
}

export async function create(data: CreateHorarioInput, instituicaoId: string) {
  await verifyConsistency(
    data.turmaId,
    data.componenteCurricularId,
    instituicaoId
  );

  // REGRA DE NEGÓCIO: Previne conflitos de horário para a mesma turma.
  const conflito = await prisma.horarioAula.findFirst({
    where: {
      turmaId: data.turmaId,
      dia_semana: data.dia_semana,
      // Verifica se o novo horário começa ou termina durante um horário existente
      OR: [
        {
          hora_inicio: { lt: data.hora_fim },
          hora_fim: { gt: data.hora_inicio },
        },
      ],
    },
  });

  if (conflito)
    throw new Error(
      "Conflito de horário detectado para esta turma neste dia e hora."
    );

  return prisma.horarioAula.create({
    data: {
      ...data,
      instituicaoId,
    },
    include: fullInclude,
  });
}

export async function findAll(
  instituicaoId: string,
  filters: FindAllHorariosInput
) {
  const where: Prisma.HorarioAulaWhereInput = { instituicaoId };

  if (filters.turmaId) where.turmaId = filters.turmaId;
  if (filters.professorId)
    where.componenteCurricular = { professorId: filters.professorId };

  return prisma.horarioAula.findMany({
    where,
    include: fullInclude,
    orderBy: [{ dia_semana: "asc" }, { hora_inicio: "asc" }],
  });
}

export async function findById(id: string, instituicaoId: string) {
  return prisma.horarioAula.findFirst({
    where: { id, instituicaoId },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: Prisma.HorarioAulaUpdateInput,
  instituicaoId: string
) {
  const horario = await findById(id, instituicaoId);
  if (!horario) throw new Error("Horário não encontrado.");

  const turmaId = horario.turmaId;
  const componenteId = data.componenteCurricularId
    ? String(data.componenteCurricularId)
    : horario.componenteCurricularId;

  await verifyConsistency(turmaId, componenteId, instituicaoId);

  return prisma.horarioAula.update({
    where: { id },
    data,
    include: fullInclude,
  });
}

export async function remove(id: string, instituicaoId: string) {
  // A verificação de posse é implícita, pois o delete só funcionará se o ID e instituicaoId baterem.
  const result = await prisma.horarioAula.deleteMany({
    where: { id, instituicaoId },
  });
  if (result.count === 0) throw new Error("Horário não encontrado.");
}

export const horarioService = { create, findAll, findById, update, remove };
