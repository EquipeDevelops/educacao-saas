import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

async function getHorarios(user: AuthenticatedRequest["user"]) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário não vinculado a uma unidade escolar.");
  }

  const horarios = await prisma.horarioAula.findMany({
    where: {
      unidadeEscolarId: user.unidadeEscolarId,
    },
    include: {
      turma: {
        select: {
          id: true,
          nome: true,
          serie: true,
        },
      },
      componenteCurricular: {
        include: {
          materia: {
            select: {
              nome: true,
            },
          },
          professor: {
            include: {
              usuario: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return horarios;
}

async function getEventos(user: AuthenticatedRequest["user"]) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário não vinculado a uma unidade escolar.");
  }

  const eventos = await prisma.eventosCalendario.findMany({
    where: {
      unidadeEscolarId: user.unidadeEscolarId,
    },
  });

  return eventos;
}

export const gestorDashboardService = {
  getHorarios,
  getEventos,
};
