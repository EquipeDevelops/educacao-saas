import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { api } from "../config/api";

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

  const eventos = await prisma.eventosCalendario.findMany({
    where: { unidadeEscolarId: user.unidadeEscolarId },
    orderBy: { data_inicio: "asc" },
  });

  return eventos;
}

async function findAllByMonth(mes: string, user: AuthenticatedRequest["user"]) {
  if (!user.unidadeEscolarId) return [];

  const [year, month] = mes.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Buscar eventos normais
  const eventos = await prisma.eventosCalendario.findMany({
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
    include: {
      turma: {
        select: {
          nome: true,
          serie: true,
        },
      },
      criadoPor: {
        select: {
          nome: true,
        },
      },
    },
  });

  return eventos;
}

async function findAllByMonthWithHorarios(
  mes: string,
  user: AuthenticatedRequest["user"],
  incluirHorarios: boolean = true
) {
  if (!user.unidadeEscolarId) return [];

  const [year, month] = mes.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Buscar eventos normais
  const eventosNormais = await prisma.eventosCalendario.findMany({
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
    include: {
      turma: {
        select: {
          nome: true,
          serie: true,
        },
      },
      criadoPor: {
        select: {
          nome: true,
        },
      },
    },
  });

  if (!incluirHorarios) {
    return eventosNormais;
  }

  // Buscar horários de aula e transformar em eventos
  const horariosAula = await getHorariosComoEventos(user.unidadeEscolarId, mes);

  // Combinar e ordenar
  const todosEventos = [...eventosNormais, ...horariosAula].sort(
    (a, b) => a.data_inicio.getTime() - b.data_inicio.getTime()
  );

  return todosEventos;
}

async function getHorariosComoEventos(unidadeEscolarId: string, mes?: string) {
  const horarios = await prisma.horarioAula.findMany({
    where: { unidadeEscolarId },
    include: {
      componenteCurricular: {
        include: {
          materia: true,
          professor: {
            include: {
              usuario: true,
            },
          },
        },
      },
      turma: true,
    },
  });

  // Transformar horários em eventos
  const eventos: any[] = [];

  const hoje = new Date();
  let dataInicio: Date;
  let dataFim: Date;

  if (mes) {
    const [ano, mesNum] = mes.split("-").map(Number);
    dataInicio = new Date(ano, mesNum - 1, 1);
    dataFim = new Date(ano, mesNum, 0);
  } else {
    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  }

  const diasSemanaMap: { [key: string]: number } = {
    DOMINGO: 0,
    SEGUNDA: 1,
    TERCA: 2,
    QUARTA: 3,
    QUINTA: 4,
    SEXTA: 5,
    SABADO: 6,
  };

  horarios.forEach((horario) => {
    const diaSemanaNum = diasSemanaMap[horario.dia_semana];

    for (
      let data = new Date(dataInicio);
      data <= dataFim;
      data.setDate(data.getDate() + 1)
    ) {
      if (data.getDay() === diaSemanaNum) {
        const [horaInicio, minutoInicio] = horario.hora_inicio
          .split(":")
          .map(Number);
        const [horaFim, minutoFim] = horario.hora_fim.split(":").map(Number);

        const dataInicioEvento = new Date(data);
        dataInicioEvento.setHours(horaInicio, minutoInicio, 0, 0);

        const dataFimEvento = new Date(data);
        dataFimEvento.setHours(horaFim, minutoFim, 0, 0);

        eventos.push({
          id: `horario-${horario.id}-${data.toISOString().split("T")[0]}`,
          titulo: `${horario.componenteCurricular.materia.nome} - ${horario.turma.serie} ${horario.turma.nome}`,
          descricao: `Professor: ${horario.componenteCurricular.professor.usuario.nome}`,
          tipo: "AULA",
          data_inicio: dataInicioEvento,
          data_fim: dataFimEvento,
          dia_inteiro: false,
          turmaId: horario.turmaId,
          turma: horario.turma,
          horarioAulaId: horario.id,
          local: horario.local,
          isHorarioAula: true,
          unidadeEscolarId: horario.unidadeEscolarId,
          criadoPor: {
            nome: "Sistema (Horário de Aula)",
          },
        });
      }
    }
  });

  return eventos;
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
  findAllByMonthWithHorarios,
  remove,
  findAll,
  update,
  getHorariosComoEventos,
};
