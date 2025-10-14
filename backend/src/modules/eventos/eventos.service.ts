import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

type CreateEventoData = {
  titulo: string;
  descricao?: string;
  tipo: any;
  data_inicio: string;
  data_fim: string;
  dia_inteiro?: boolean;
  turmaId?: string;
};

async function findAll(user: AuthenticatedRequest["user"]) {
  if (!user.unidadeEscolarId) return [];

  return prisma.eventosCalendario.findMany({
    where: { unidadeEscolarId: user.unidadeEscolarId },
    orderBy: { data_inicio: "asc" },
  });
}

async function create(
  data: CreateEventoData,
  user: AuthenticatedRequest["user"]
) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário não está associado a uma unidade escolar.");
  }
  return prisma.eventosCalendario.create({
    data: {
      ...data,
      data_inicio: new Date(data.data_inicio),
      data_fim: new Date(data.data_fim),
      unidadeEscolarId: user.unidadeEscolarId,
      criadoPorId: user.id,
    },
  });
}

async function findAllByMonth(mes: string, user: AuthenticatedRequest["user"]) {
  if (!user.unidadeEscolarId) return [];

  const [year, month] = mes.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return prisma.eventosCalendario.findMany({
    where: {
      unidadeEscolarId: user.unidadeEscolarId,
      data_inicio: {
        lte: endDate,
      },
      data_fim: {
        gte: startDate,
      },
    },
    orderBy: {
      data_inicio: "asc",
    },
  });
}
async function update(
  id: string,
  data: Partial<CreateEventoData>,
  user: AuthenticatedRequest["user"]
) {
  const evento = await prisma.eventosCalendario.findFirst({
    where: { id, unidadeEscolarId: user.unidadeEscolarId },
  });

  if (!evento) throw new Error("Evento não encontrado.");

  if (user.papel !== "GESTOR" && evento.criadoPorId !== user.id) {
    throw new Error("Você não tem permissão para editar este evento.");
  }

  return prisma.eventosCalendario.update({
    where: { id },
    data: {
      ...data,
      ...(data.data_inicio ? { data_inicio: new Date(data.data_inicio) } : {}),
      ...(data.data_fim ? { data_fim: new Date(data.data_fim) } : {}),
    },
  });
}

async function remove(id: string, user: AuthenticatedRequest["user"]) {
  const evento = await prisma.eventosCalendario.findFirstOrThrow({
    where: { id, unidadeEscolarId: user.unidadeEscolarId },
  });

  if (user.papel !== "GESTOR" && evento.criadoPorId !== user.id) {
    throw new Error("Você não tem permissão para deletar este evento.");
  }

  return prisma.eventosCalendario.delete({ where: { id } });
}

export const eventosService = {
  create,
  findAllByMonth,
  remove,
  findAll,
  update,
};
