import { Prisma, PrismaClient } from "@prisma/client";
import {
  CreateHorarioInput,
  FindAllHorariosInput,
} from "./horarioAula.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

const fullInclude = {
  turma: { select: { id: true, nome: true, serie: true } },
  componenteCurricular: {
    include: {
      materia: { select: { nome: true } },
      professor: { include: { usuario: { select: { nome: true } } } },
      turma: { select: { nome: true, serie: true } },
    },
  },
};

async function verifyConsistency(
  turmaId: string,
  componenteCurricularId: string,
  unidadeEscolarId: string
) {
  const componente = await prisma.componenteCurricular.findFirst({
    where: {
      id: componenteCurricularId,
      turma: { unidadeEscolarId },
    },
  });

  if (!componente) {
    throw new Error(
      "Componente curricular não encontrado na sua unidade escolar."
    );
  }
  if (componente.turmaId !== turmaId) {
    throw new Error(
      "Este componente curricular não pertence à turma informada."
    );
  }
}

export async function create(
  data: CreateHorarioInput,
  unidadeEscolarId: string
) {
  await verifyConsistency(
    data.turmaId,
    data.componenteCurricularId,
    unidadeEscolarId
  );

  const conflito = await prisma.horarioAula.findFirst({
    where: {
      turmaId: data.turmaId,
      dia_semana: data.dia_semana,
      OR: [
        {
          hora_inicio: { lt: data.hora_fim },
          hora_fim: { gt: data.hora_inicio },
        },
      ],
    },
  });

  if (conflito) {
    throw new Error(
      "Conflito de horário detectado para esta turma neste dia e hora."
    );
  }

  return prisma.horarioAula.create({
    data: { ...data, unidadeEscolarId },
    include: fullInclude,
  });
}

export async function findAll(
  user: AuthenticatedRequest["user"],
  filters: FindAllHorariosInput
) {
  const where: Prisma.HorarioAulaWhereInput = {
    unidadeEscolarId: user.unidadeEscolarId,
  };

  if (filters.turmaId) where.turmaId = filters.turmaId;
  if (filters.professorId)
    where.componenteCurricular = { professorId: filters.professorId };

  if (user.papel === "PROFESSOR") {
    where.componenteCurricular = { professorId: user.perfilId! };
  }
  if (user.papel === "ALUNO") {
    const matricula = await prisma.matriculas.findFirst({
      where: { aluno: { usuarioId: user.id }, status: "ATIVA" },
      select: { turmaId: true },
    });
    where.turmaId = matricula?.turmaId || "nenhuma-turma-encontrada";
  }

  return prisma.horarioAula.findMany({
    where,
    include: fullInclude,
    orderBy: [{ dia_semana: "asc" }, { hora_inicio: "asc" }],
  });
}

export async function findById(id: string, unidadeEscolarId: string) {
  return prisma.horarioAula.findFirst({
    where: { id, unidadeEscolarId },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: Prisma.HorarioAulaUpdateInput,
  unidadeEscolarId: string
) {
  const horario = await findById(id, unidadeEscolarId);
  if (!horario) throw new Error("Horário não encontrado.");

  const turmaId = horario.turmaId;
  const componenteId = data.componenteCurricularId
    ? String(data.componenteCurricularId)
    : horario.componenteCurricularId;

  await verifyConsistency(turmaId, componenteId, unidadeEscolarId);

  return prisma.horarioAula.update({
    where: { id },
    data,
    include: fullInclude,
  });
}

export async function remove(id: string, unidadeEscolarId: string) {
  const result = await prisma.horarioAula.deleteMany({
    where: { id, unidadeEscolarId },
  });
  if (result.count === 0) throw new Error("Horário não encontrado.");
}

export const horarioService = { create, findAll, findById, update, remove };
