import { DiaDaSemana, PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

const findAllPerfis = (unidadeEscolarId: string) => {
  console.log(
    "[SERVICE] Buscando todos os perfis de alunos para a unidade:",
    unidadeEscolarId
  );
  return prisma.usuarios_aluno.findMany({
    where: { usuario: { unidadeEscolarId: unidadeEscolarId, status: true } },
    select: {
      id: true,
      numero_matricula: true,
      usuario: { select: { id: true, nome: true } },
    },
    orderBy: { usuario: { nome: "asc" } },
  });
};

const findOneByUserId = async (usuarioId: string) => {
  return prisma.usuarios_aluno.findFirst({
    where: { usuarioId: usuarioId },
    select: {
      id: true,
      usuario: { select: { id: true, nome: true, email: true } },
      matriculas: {
        where: { status: "ATIVA" },
        select: { id: true },
        take: 1,
      },
    },
  });
};
async function getBoletim(usuarioId: string) {
  console.log(
    `\n--- [BOLETIM SERVICE] Iniciando para o usuário ID: ${usuarioId} ---`
  );

  const perfilAluno = await prisma.usuarios_aluno.findUnique({
    where: { usuarioId },
    select: { id: true },
  });

  if (!perfilAluno) {
    console.error(
      `[BOLETIM SERVICE] ERRO: Perfil de aluno não encontrado para o usuário ID: ${usuarioId}`
    );
    throw new Error("Perfil de aluno não encontrado para este usuário.");
  }
  const alunoPerfilId = perfilAluno.id;
  console.log(
    `[BOLETIM SERVICE] Perfil de aluno encontrado. ID do Perfil: ${alunoPerfilId}`
  );

  const [avaliacoes, submissoes] = await Promise.all([
    prisma.avaliacaoParcial.findMany({
      where: { matricula: { alunoId: alunoPerfilId, status: "ATIVA" } },
      select: {
        nota: true,
        periodo: true,
        tipo: true,
        componenteCurricular: {
          select: { materia: { select: { nome: true } } },
        },
      },
    }),
    prisma.submissoes.findMany({
      where: {
        alunoId: alunoPerfilId,
        status: "AVALIADA",
        nota_total: { not: null },
      },
      select: {
        nota_total: true,
        tarefa: {
          select: {
            tipo: true,
            componenteCurricular: {
              select: { materia: { select: { nome: true } } },
            },
          },
        },
      },
    }),
  ]);
  console.log(
    `[BOLETIM SERVICE] Encontradas ${avaliacoes.length} avaliações parciais e ${submissoes.length} submissões.`
  );

  const todasAsNotas: {
    materia: string;
    periodo: string;
    tipo: string;
    nota: number;
  }[] = [];

  avaliacoes.forEach((av) => {
    if (av.componenteCurricular?.materia?.nome) {
      todasAsNotas.push({
        materia: av.componenteCurricular.materia.nome,
        periodo: av.periodo,
        tipo: String(av.tipo),
        nota: av.nota,
      });
    } else {
      console.warn(
        "[BOLETIM SERVICE] Aviso: Ignorando avaliação parcial sem matéria associada."
      );
    }
  });

  submissoes.forEach((sub) => {
    if (sub.tarefa?.componenteCurricular?.materia?.nome) {
      todasAsNotas.push({
        materia: sub.tarefa.componenteCurricular.materia.nome,
        periodo: "ATIVIDADES_CONTINUAS",
        tipo: String(sub.tarefa.tipo),
        nota: sub.nota_total!,
      });
    } else {
      console.warn(
        "[BOLETIM SERVICE] Aviso: Ignorando submissão sem matéria associada."
      );
    }
  });
  console.log(
    `[BOLETIM SERVICE] Total de notas válidas processadas: ${todasAsNotas.length}`
  );

  const boletimFinal = todasAsNotas.reduce((acc: Record<string, any>, nota) => {
    if (!acc[nota.materia]) acc[nota.materia] = {};
    if (!acc[nota.materia][nota.periodo]) {
      acc[nota.materia][nota.periodo] = { avaliacoes: [], media: 0 };
    }
    acc[nota.materia][nota.periodo].avaliacoes.push({
      tipo: nota.tipo,
      nota: nota.nota,
    });
    return acc;
  }, {});

  for (const materia in boletimFinal) {
    let notasDaMateria: number[] = [];
    for (const periodo in boletimFinal[materia]) {
      const notasDoPeriodo = boletimFinal[materia][periodo].avaliacoes.map(
        (av: any) => av.nota
      );
      notasDaMateria.push(...notasDoPeriodo);
      if (notasDoPeriodo.length > 0) {
        const mediaPeriodo =
          notasDoPeriodo.reduce((a: number, b: number) => a + b, 0) /
          notasDoPeriodo.length;
        boletimFinal[materia][periodo].media = parseFloat(
          mediaPeriodo.toFixed(2)
        );
      }
    }
    if (notasDaMateria.length > 0) {
      const mediaFinalMateria =
        notasDaMateria.reduce((a, b) => a + b, 0) / notasDaMateria.length;
      boletimFinal[materia].mediaFinalGeral = parseFloat(
        mediaFinalMateria.toFixed(2)
      );
    } else {
      boletimFinal[materia].mediaFinalGeral = 0;
    }
  }

  console.log(
    "[BOLETIM SERVICE] Boletim finalizado e pronto para ser enviado."
  );
  return boletimFinal;
}

type AgendaEventoTipo =
  | "Aula"
  | "Prova"
  | "Trabalho"
  | "Tarefa"
  | "Recuperação"
  | "Reunião"
  | "Feriado"
  | "Evento Escolar";

type AgendaEvento = {
  id: string;
  date: Date;
  type: AgendaEventoTipo;
  title: string;
  details?: string;
  time?: string;
};

const diaSemanaMap: Record<DiaDaSemana, number> = {
  DOMINGO: 0,
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
};

const tipoMap: Record<string, AgendaEventoTipo> = {
  AULA: "Aula",
  PROVA: "Prova",
  TRABALHO: "Trabalho",
  TAREFA: "Tarefa",
  RECUPERACAO: "Recuperação",
  RECUPERACAO_FINAL: "Recuperação",
  REUNIAO: "Reunião",
  FERIADO: "Feriado",
  EVENTO_ESCOLAR: "Evento Escolar",
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const addDays = (date: Date, amount: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
};

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const formatTime = (date: Date | null | undefined) => {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(11, 16);
};

async function getAgendaEventos(
  user: AuthenticatedRequest["user"],
  rangeStart: Date,
  rangeEnd: Date
) {
  if (!user?.perfilId) {
    return [];
  }

  const start = startOfDay(rangeStart);
  const end = endOfDay(rangeEnd);

  const matriculaAtiva = await prisma.matriculas.findFirst({
    where: { alunoId: user.perfilId, status: "ATIVA" },
    select: { turmaId: true },
  });

  if (!matriculaAtiva) {
    return [];
  }

  const [horarios, tarefas, eventosGerais] = await Promise.all([
    prisma.horarioAula.findMany({
      where: { turmaId: matriculaAtiva.turmaId },
      include: {
        componenteCurricular: {
          select: { materia: { select: { nome: true } } },
        },
        turma: { select: { nome: true } },
      },
    }),
    prisma.tarefas.findMany({
      where: {
        publicado: true,
        data_entrega: {
          gte: start,
          lte: end,
        },
        componenteCurricular: { turmaId: matriculaAtiva.turmaId },
      },
      include: {
        componenteCurricular: {
          select: { materia: { select: { nome: true } } },
        },
      },
    }),
    prisma.eventosCalendario.findMany({
      where: {
        ...(user.unidadeEscolarId
          ? { unidadeEscolarId: user.unidadeEscolarId }
          : {}),
        data_inicio: { lte: end },
        data_fim: { gte: start },
        OR: [{ turmaId: null }, { turmaId: matriculaAtiva.turmaId }],
      },
      include: {
        turma: { select: { nome: true } },
      },
    }),
  ]);

  const eventos: AgendaEvento[] = [];

  for (
    let current = startOfDay(start);
    current.getTime() <= end.getTime();
    current = addDays(current, 1)
  ) {
    const diaSemanaAtual = current.getDay();

    horarios.forEach((horario) => {
      const diaHorario = diaSemanaMap[horario.dia_semana as DiaDaSemana];
      if (diaHorario === diaSemanaAtual) {
        eventos.push({
          id: `aula-${horario.id}-${formatDateKey(current)}`,
          date: new Date(current),
          type: "Aula",
          title:
            horario.componenteCurricular?.materia?.nome ||
            horario.turma?.nome ||
            "Aula",
          details: horario.turma?.nome || undefined,
          time: `${horario.hora_inicio} - ${horario.hora_fim}`,
        });
      }
    });
  }

  tarefas.forEach((tarefa) => {
    const entrega = new Date(tarefa.data_entrega);
    const tipo =
      tipoMap[String(tarefa.tipo).toUpperCase()] ||
      (tarefa.tipo === "PROVA"
        ? "Prova"
        : tarefa.tipo === "TRABALHO"
        ? "Trabalho"
        : "Tarefa");

    eventos.push({
      id: `tarefa-${tarefa.id}`,
      date: entrega,
      type: tipo,
      title: tarefa.titulo,
      details: tarefa.componenteCurricular?.materia?.nome || undefined,
      time: formatTime(entrega),
    });
  });

  eventosGerais.forEach((evento) => {
    const inicioOriginal = new Date(evento.data_inicio);
    const fimOriginal = evento.data_fim
      ? new Date(evento.data_fim)
      : new Date(evento.data_inicio);

    const inicio = startOfDay(inicioOriginal < start ? start : inicioOriginal);
    const fim = startOfDay(fimOriginal > end ? end : fimOriginal);

    for (
      let dia = new Date(inicio);
      dia.getTime() <= fim.getTime();
      dia = addDays(dia, 1)
    ) {
      const isPrimeiroDia =
        formatDateKey(dia) === formatDateKey(startOfDay(inicioOriginal));

      eventos.push({
        id: `evento-${evento.id}-${formatDateKey(dia)}`,
        date: new Date(dia),
        type: tipoMap[String(evento.tipo).toUpperCase()] || "Evento Escolar",
        title: evento.titulo,
        details:
          [evento.descricao, evento.turma?.nome].filter(Boolean).join(" • ") ||
          undefined,
        time: evento.dia_inteiro
          ? "Dia inteiro"
          : isPrimeiroDia
          ? formatTime(inicioOriginal)
          : undefined,
      });
    }
  });

  eventos.sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    if (diff !== 0) return diff;

    const horaA = a.time?.slice(0, 5) || "";
    const horaB = b.time?.slice(0, 5) || "";
    return horaA.localeCompare(horaB);
  });

  return eventos.map((evento) => ({
    ...evento,
    date: evento.date.toISOString(),
  }));
}

export const alunoService = {
  findAllPerfis,
  findOne: findOneByUserId,
  getBoletim,
  getAgendaEventos,
};
