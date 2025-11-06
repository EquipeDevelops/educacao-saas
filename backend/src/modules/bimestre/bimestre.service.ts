import {
  PeriodoAvaliacao,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";
import {
  CreateBimestreInput,
  FindAllBimestresInput,
  FindVigenteInput,
  UpdateBimestreInput,
} from "./bimestre.validator";

const prisma = new PrismaClient();

const parseDate = (value: string): Date => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Data inválida informada.");
  }
  return date;
};

const ensureGestorContext = (user: AuthenticatedRequest["user"]) => {
  if (!user.unidadeEscolarId) {
    throw new Error(
      "Usuário não possui unidade escolar vinculada para gerenciar bimestres."
    );
  }
  return user.unidadeEscolarId;
};

const existsOverlap = async (
  unidadeEscolarId: string,
  anoLetivo: number,
  dataInicio: Date,
  dataFim: Date,
  ignoreId?: string
) => {
  const overlap = await prisma.bimestres.findFirst({
    where: {
      unidadeEscolarId,
      anoLetivo,
      ...(ignoreId && ignoreId.trim() !== ""
        ? { NOT: { id: ignoreId } }
        : {}),
      AND: [
        {
          dataInicio: { lte: dataFim },
        },
        {
          dataFim: { gte: dataInicio },
        },
      ],
    },
  });

  return overlap;
};

const ensurePeriodoAvailability = async (
  unidadeEscolarId: string,
  anoLetivo: number,
  periodo: PeriodoAvaliacao,
  ignoreId?: string
) => {
  const existing = await prisma.bimestres.findFirst({
    where: {
      unidadeEscolarId,
      anoLetivo,
      periodo,
      ...(ignoreId ? { NOT: { id: ignoreId } } : {}),
    },
  });

  if (existing) {
    throw new Error(
      "Já existe um bimestre cadastrado para este período nesse ano letivo."
    );
  }
};

const create = async (
  payload: CreateBimestreInput,
  user: AuthenticatedRequest["user"]
) => {
  const unidadeEscolarId = ensureGestorContext(user);
  const dataInicio = parseDate(payload.dataInicio);
  const dataFim = parseDate(payload.dataFim);

  if (dataFim < dataInicio) {
    throw new Error("A data final não pode ser anterior à data inicial.");
  }

  await ensurePeriodoAvailability(
    unidadeEscolarId,
    payload.anoLetivo,
    payload.periodo
  );

  const overlap = await existsOverlap(
    unidadeEscolarId,
    payload.anoLetivo,
    dataInicio,
    dataFim
  );

  if (overlap) {
    throw new Error(
      "O período informado se sobrepõe a outro bimestre do mesmo ano letivo."
    );
  }

  return prisma.bimestres.create({
    data: {
      anoLetivo: payload.anoLetivo,
      periodo: payload.periodo,
      dataInicio,
      dataFim,
      nome: payload.nome,
      unidadeEscolarId,
    },
  });
};

const findAll = async (
  user: AuthenticatedRequest["user"],
  filters: FindAllBimestresInput
) => {
  const unidadeEscolarId = ensureGestorContext(user);
  const anoLetivo = filters.anoLetivo
    ? Number(filters.anoLetivo)
    : undefined;

  return prisma.bimestres.findMany({
    where: {
      unidadeEscolarId,
      ...(anoLetivo ? { anoLetivo } : {}),
    },
    orderBy: [
      { anoLetivo: "desc" },
      { dataInicio: "asc" },
    ],
  });
};

const update = async (
  id: string,
  payload: UpdateBimestreInput,
  user: AuthenticatedRequest["user"]
) => {
  const unidadeEscolarId = ensureGestorContext(user);

  const bimestre = await prisma.bimestres.findFirst({
    where: { id, unidadeEscolarId },
  });

  if (!bimestre) {
    const error = new Error("Bimestre não encontrado.");
    (error as any).code = "P2025";
    throw error;
  }

  const anoLetivo = payload.anoLetivo ?? bimestre.anoLetivo;
  const periodo = payload.periodo ?? bimestre.periodo;
  const dataInicio = payload.dataInicio
    ? parseDate(payload.dataInicio)
    : bimestre.dataInicio;
  const dataFim = payload.dataFim
    ? parseDate(payload.dataFim)
    : bimestre.dataFim;

  if (dataFim < dataInicio) {
    throw new Error("A data final não pode ser anterior à data inicial.");
  }

  if (periodo !== bimestre.periodo || anoLetivo !== bimestre.anoLetivo) {
    await ensurePeriodoAvailability(
      unidadeEscolarId,
      anoLetivo,
      periodo,
      id
    );
  }

  const overlap = await existsOverlap(
    unidadeEscolarId,
    anoLetivo,
    dataInicio,
    dataFim,
    id
  );

  if (overlap) {
    throw new Error(
      "O período informado se sobrepõe a outro bimestre do mesmo ano letivo."
    );
  }

  return prisma.bimestres.update({
    where: { id },
    data: {
      anoLetivo,
      periodo,
      dataInicio,
      dataFim,
      nome: payload.nome ?? bimestre.nome,
    },
  });
};

const findVigente = async (
  user: AuthenticatedRequest["user"],
  filters: FindVigenteInput
) => {
  const unidadeEscolarId = ensureGestorContext(user);
  const referencia = filters.referencia
    ? parseDate(filters.referencia)
    : new Date();

  return prisma.bimestres.findFirst({
    where: {
      unidadeEscolarId,
      dataInicio: { lte: referencia },
      dataFim: { gte: referencia },
    },
    orderBy: { dataInicio: "asc" },
  });
};

export const bimestreService = {
  create,
  findAll,
  update,
  findVigente,
};
