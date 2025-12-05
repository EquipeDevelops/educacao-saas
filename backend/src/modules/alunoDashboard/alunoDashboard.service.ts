import { DiaDaSemana, PrismaClient, StatusSubmissao } from '@prisma/client';
import { AuthenticatedRequest } from '../../middlewares/auth';

const prisma = new PrismaClient();

const diaSemanaMap: Record<DiaDaSemana, number> = {
  DOMINGO: 0,
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
};

const eventTypeMap: { [key: string]: any } = {
  REUNIAO: 'Reunião',
  RECUPERACAO: 'Recuperação',
  FERIADO: 'Feriado',
  EVENTO_ESCOLAR: 'Evento Escolar',
};

const formatHorario = (date?: Date | null) => {
  if (!date || Number.isNaN(date.getTime())) {
    return undefined;
  }
  const horas = date.getHours().toString().padStart(2, '0');
  const minutos = date.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
};

async function getPerformanceStats(user: AuthenticatedRequest['user']) {
  const { perfilId: alunoId } = user;
  if (!alunoId) {
    throw new Error('Usuário não é um aluno válido.');
  }

  const matriculaAtiva = await prisma.matriculas.findFirst({
    where: { alunoId, status: 'ATIVA' },
    select: { id: true, turmaId: true },
  });

  if (!matriculaAtiva) {
    return {
      taxaDeConclusao: 0,
      ultimaNota: null,
      mediaGeral: 0,
      notaMaisAlta: null,
      notaMaisBaixa: null,
      melhorMateria: null,
    };
  }

  const totalTarefasDaTurma = await prisma.tarefas.count({
    where: {
      publicado: true,
      componenteCurricular: { turmaId: matriculaAtiva.turmaId },
    },
  });

  const submissoesAgrupadas = await prisma.submissoes.groupBy({
    by: ['tarefaId'],
    where: {
      alunoId,
      status: {
        in: [
          StatusSubmissao.ENVIADA,
          StatusSubmissao.ENVIADA_COM_ATRASO,
          StatusSubmissao.AVALIADA,
        ],
      },
      tarefa: {
        publicado: true,
        componenteCurricular: {
          turmaId: matriculaAtiva.turmaId,
        },
      },
    },
    _count: {
      tarefaId: true,
    },
  });

  const totalTarefasConcluidasPeloAluno = submissoesAgrupadas.length;

  const taxaDeConclusao =
    totalTarefasDaTurma > 0
      ? Math.round(
          (totalTarefasConcluidasPeloAluno / totalTarefasDaTurma) * 100,
        )
      : 0;

  const submissoesParaNotas = await prisma.submissoes.findMany({
    where: {
      alunoId,
      tarefa: { componenteCurricular: { turmaId: matriculaAtiva.turmaId } },
      status: 'AVALIADA',
      nota_total: { not: null },
    },
    select: {
      nota_total: true,
      atualizado_em: true,
      tarefa: {
        select: {
          componenteCurricular: {
            select: { materia: { select: { nome: true } } },
          },
        },
      },
    },
    orderBy: { atualizado_em: 'desc' },
  });

  const notas = submissoesParaNotas.map((s) => s.nota_total!);

  const ultimaNota =
    submissoesParaNotas.length > 0 ? submissoesParaNotas[0].nota_total : null;
  const mediaGeral =
    notas.length > 0
      ? parseFloat((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1))
      : 0;
  const notaMaisAlta = notas.length > 0 ? Math.max(...notas) : null;
  const notaMaisBaixa = notas.length > 0 ? Math.min(...notas) : null;

  const notasPorMateria = new Map<string, { soma: number; count: number }>();
  submissoesParaNotas.forEach((s) => {
    const materia = s.tarefa.componenteCurricular.materia.nome;
    const nota = s.nota_total!;
    const entry = notasPorMateria.get(materia) || { soma: 0, count: 0 };
    entry.soma += nota;
    entry.count += 1;
    notasPorMateria.set(materia, entry);
  });
  let melhorMateria = null;
  let maiorMedia = -1;
  for (const [materia, data] of notasPorMateria.entries()) {
    const media = data.soma / data.count;
    if (media > maiorMedia) {
      maiorMedia = media;
      melhorMateria = materia;
    }
  }
  return {
    taxaDeConclusao,
    ultimaNota,
    mediaGeral,
    notaMaisAlta,
    notaMaisBaixa,
    melhorMateria,
  };
}

async function getHeaderInfo(user: AuthenticatedRequest['user']) {
  const { perfilId: alunoId } = user;
  if (!alunoId) {
    throw new Error('Usuário não é um aluno válido.');
  }

  const alunoPerfil = await prisma.usuarios_aluno.findUnique({
    where: { id: alunoId },
    include: { usuario: { select: { nome: true, fotoUrl: true } } },
  });

  const matriculaAtiva = await prisma.matriculas.findFirst({
    where: { alunoId, status: 'ATIVA' },
    include: { turma: { select: { nome: true, serie: true } } },
  });

  let escolaNome = undefined;
  if (user.unidadeEscolarId) {
    const unidadeEscolar = await prisma.unidades_Escolares.findUnique({
      where: { id: user.unidadeEscolarId },
      select: { nome: true },
    });
    escolaNome = unidadeEscolar?.nome;
  }

  return {
    nome: alunoPerfil?.usuario.nome,
    fotoUrl: alunoPerfil?.usuario.fotoUrl,
    turma: matriculaAtiva?.turma.nome,
    ano: matriculaAtiva?.turma.serie,
    escola: escolaNome,
  };
}

async function getHomeStats(user: AuthenticatedRequest['user']) {
  const { perfilId: alunoId, unidadeEscolarId } = user;
  if (!alunoId || !unidadeEscolarId) {
    throw new Error('Usuário não é um aluno válido ou não está em uma escola.');
  }
  const matriculaAtiva = await prisma.matriculas.findFirst({
    where: { alunoId, status: 'ATIVA' },
  });

  let attendancePercentage = 100;
  let ranking = { position: 1, total: 1 };

  if (matriculaAtiva) {
    // Tenta calcular a frequência baseada no Diário de Aula (novo sistema)
    const totalRegistrosDiario = await prisma.diarioAulaPresenca.count({
      where: {
        matriculaId: matriculaAtiva.id,
        diarioAula: { status: 'CONSOLIDADO' },
      },
    });

    if (totalRegistrosDiario > 0) {
      const totalFaltasDiario = await prisma.diarioAulaPresenca.count({
        where: {
          matriculaId: matriculaAtiva.id,
          situacao: { not: 'PRESENTE' },
          diarioAula: { status: 'CONSOLIDADO' },
        },
      });
      attendancePercentage =
        ((totalRegistrosDiario - totalFaltasDiario) / totalRegistrosDiario) *
        100;
    } else {
      // Fallback para o sistema antigo (RegistroFalta)
      const totalFaltas = await prisma.registroFalta.count({
        where: { matriculaId: matriculaAtiva.id, justificada: false },
      });
      const DIAS_LETIVOS_TOTAIS = 100;
      attendancePercentage = Math.max(
        0,
        ((DIAS_LETIVOS_TOTAIS - totalFaltas) / DIAS_LETIVOS_TOTAIS) * 100,
      );
    }

    const submissoesDaTurma = await prisma.submissoes.findMany({
      where: {
        status: 'AVALIADA',
        nota_total: { not: null },
        tarefa: {
          componenteCurricular: {
            turmaId: matriculaAtiva.turmaId,
          },
        },
      },
      select: { alunoId: true, nota_total: true },
    });

    const notasPorAluno = new Map<string, { total: number; count: number }>();
    submissoesDaTurma.forEach((sub) => {
      if (sub.nota_total !== null) {
        const entry = notasPorAluno.get(sub.alunoId) || { total: 0, count: 0 };
        entry.total += sub.nota_total;
        entry.count += 1;
        notasPorAluno.set(sub.alunoId, entry);
      }
    });

    const medias = Array.from(notasPorAluno.entries()).map(
      ([alunoId, data]) => ({
        alunoId,
        media: data.count > 0 ? data.total / data.count : 0,
      }),
    );
    medias.sort((a, b) => b.media - a.media);

    const rankPosition =
      medias.findIndex((aluno) => aluno.alunoId === alunoId) + 1;
    ranking = {
      position: rankPosition > 0 ? rankPosition : medias.length + 1,
      total: medias.length > 0 ? medias.length : 1,
    };
  }

  const [conquistasObtidas, conquistasTotais] = await Promise.all([
    prisma.conquistas_Usuarios.count({ where: { alunoPerfilId: alunoId } }),
    prisma.conquistasPorUnidade.count({
      where: { unidadeEscolarId: unidadeEscolarId },
    }),
  ]);

  return {
    ranking,
    attendancePercentage: Math.round(attendancePercentage),
    conquistas: {
      obtidas: conquistasObtidas,
      totais: conquistasTotais,
    },
  };
}

async function getProximasAulas(user: AuthenticatedRequest['user']) {
  const { perfilId: alunoId } = user;
  if (!alunoId) return [];

  const matriculaAtiva = await prisma.matriculas.findFirst({
    where: { alunoId, status: 'ATIVA' },
  });
  if (!matriculaAtiva) return [];
  const todosHorarios = await prisma.horarioAula.findMany({
    where: { turmaId: matriculaAtiva.turmaId },
    include: {
      componenteCurricular: {
        select: { materia: { select: { nome: true } } },
      },
    },
  });
  const agora = new Date();
  const diaAtual = agora.getDay();
  const horaAtual = agora.toTimeString().slice(0, 5);
  return todosHorarios
    .sort((a, b) => {
      const diaA = diaSemanaMap[a.dia_semana];
      const diaB = diaSemanaMap[b.dia_semana];
      const horaA = a.hora_inicio;
      const horaB = b.hora_inicio;
      const diaAjustadoA = (diaA - diaAtual + 7) % 7;
      const diaAjustadoB = (diaB - diaAtual + 7) % 7;
      if (diaAjustadoA !== diaAjustadoB) return diaAjustadoA - diaAjustadoB;
      return horaA.localeCompare(horaB);
    })
    .filter((aula) => {
      const diaAula = diaSemanaMap[aula.dia_semana];
      const diaAjustado = (diaAula - diaAtual + 7) % 7;
      if (diaAjustado === 0) return aula.hora_inicio > horaAtual;
      return true;
    })
    .slice(0, 2);
}

async function getProximaTarefa(user: AuthenticatedRequest['user']) {
  const { perfilId: alunoId } = user;
  if (!alunoId) return null;

  const matriculaAtiva = await prisma.matriculas.findFirst({
    where: { alunoId, status: 'ATIVA' },
    select: { turmaId: true },
  });
  if (!matriculaAtiva) {
    return null;
  }
  return await prisma.tarefas.findFirst({
    where: {
      publicado: true,
      data_entrega: { gt: new Date() },
      componenteCurricular: {
        turmaId: matriculaAtiva.turmaId,
      },
    },
    orderBy: {
      data_entrega: 'asc',
    },
  });
}

async function getAgendaDoMes(
  user: AuthenticatedRequest['user'],
  currentMonth: Date,
) {
  const { perfilId: alunoId, unidadeEscolarId } = user;
  if (!alunoId || !unidadeEscolarId) return [];

  const matriculaAtiva = await prisma.matriculas.findFirst({
    where: { alunoId, status: 'ATIVA' },
    select: { turmaId: true },
  });
  if (!matriculaAtiva) return [];
  const mesQuery = `${currentMonth.getFullYear()}-${(
    currentMonth.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}`;
  const [horarios, tarefas, eventosGerais] = await Promise.all([
    prisma.horarioAula.findMany({
      where: { turmaId: matriculaAtiva.turmaId },
      include: {
        componenteCurricular: {
          select: { materia: { select: { nome: true } } },
        },
        turma: true,
      },
    }),
    prisma.tarefas.findMany({
      where: {
        publicado: true,
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
        unidadeEscolarId: unidadeEscolarId,
        data_inicio: { gte: new Date(mesQuery) },
      },
    }),
  ]);
  const processedEvents: any[] = [];
  const ano = currentMonth.getFullYear();
  const mes = currentMonth.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  for (let i = 1; i <= diasNoMes; i++) {
    const date = new Date(ano, mes, i);
    const dayOfWeek = date.getDay();
    horarios.forEach((horario: any) => {
      if (diaSemanaMap[horario.dia_semana as DiaDaSemana] === dayOfWeek) {
        processedEvents.push({
          id: `aula-${horario.id}-${i}`,
          date,
          type: 'Aula',
          title: horario.componenteCurricular.materia.nome,
          details: horario.turma.nome,
          time: `${horario.hora_inicio} - ${horario.hora_fim}`,
        });
      }
    });
  }
  const tarefaTipoMap: Record<string, string> = {
    PROVA: 'Prova',
    TRABALHO: 'Trabalho',
    QUESTIONARIO: 'Tarefa',
    LICAO_DE_CASA: 'Tarefa',
  };

  tarefas.forEach((tarefa: any) => {
    const tipoNormalizado =
      tarefaTipoMap[String(tarefa.tipo).toUpperCase()] || null;

    if (!tipoNormalizado) {
      return;
    }

    const dataEntrega = new Date(tarefa.data_entrega);

    processedEvents.push({
      id: `tarefa-${tarefa.id}`,
      date: dataEntrega,
      type: tipoNormalizado,
      title: tarefa.titulo,
      details: tarefa.componenteCurricular.materia.nome,
      time: formatHorario(dataEntrega),
    });
  });
  eventosGerais.forEach((evento: any) => {
    processedEvents.push({
      id: `evento-${evento.id}`,
      date: new Date(evento.data_inicio),
      type: eventTypeMap[evento.tipo] || 'Evento Escolar',
      title: evento.titulo,
      details: evento.descricao || '',
    });
  });
  return processedEvents;
}

async function getTarefasPendentes(user: AuthenticatedRequest['user']) {
  const { perfilId: alunoId } = user;
  if (!alunoId) {
    return [];
  }

  const matriculaAtiva = await prisma.matriculas.findFirst({
    where: { alunoId, status: 'ATIVA' },
    select: { turmaId: true },
  });

  if (!matriculaAtiva) {
    return [];
  }
  const tarefas = await prisma.tarefas.findMany({
    where: {
      publicado: true,
      componenteCurricular: {
        turmaId: matriculaAtiva.turmaId,
      },
      NOT: {
        submissoes: {
          some: {
            alunoId: alunoId,
            status: {
              in: [
                StatusSubmissao.ENVIADA,
                StatusSubmissao.ENVIADA_COM_ATRASO,
                StatusSubmissao.AVALIADA,
              ],
            },
          },
        },
      },
    },
    select: {
      id: true,
      titulo: true,
      data_entrega: true,
      componenteCurricular: {
        select: { materia: { select: { nome: true } } },
      },
    },
    orderBy: { data_entrega: 'asc' },
    take: 5,
  });
  return tarefas;
}

async function getMensagensRecentes(user: AuthenticatedRequest['user']) {
  if (!user) return [];

  const conversas = await prisma.conversa.findMany({
    where: {
      participantes: {
        some: {
          usuarioId: user.id,
        },
      },
    },
    include: {
      participantes: {
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              papel: true,
              fotoUrl: true,
            },
          },
        },
      },
      mensagens: {
        orderBy: {
          criado_em: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      atualizado_em: 'desc',
    },
    take: 3,
  });

  const conversasFormatadas = conversas.map((conversa) => {
    const outroParticipante = conversa.participantes.find(
      (p) => p.usuarioId !== user.id,
    );
    const ultimaMensagem = conversa.mensagens[0];
    return {
      id: conversa.id,
      nome: outroParticipante?.usuario.nome || 'Usuário desconhecido',
      fotoUrl: outroParticipante?.usuario.fotoUrl,
      ultimaMensagem: ultimaMensagem?.conteudo || '',
      data: ultimaMensagem?.criado_em
        ? ultimaMensagem.criado_em.toISOString()
        : null,
      naoLida: false,
    };
  });
  return conversasFormatadas;
}

async function getComunicados(user: AuthenticatedRequest['user']) {
  if (!user.unidadeEscolarId) return [];

  const comunicados = await prisma.comunicado.findMany({
    where: {
      unidadeEscolarId: user.unidadeEscolarId,
      data_visivel: { lte: new Date() },
    },
    orderBy: {
      criado_em: 'desc',
    },
    take: 10, // Limit to recent 10 notifications
  });

  return comunicados;
}

async function getDashboardData(user: AuthenticatedRequest['user']) {
  const [
    alunoInfo,
    stats,
    proximasAulas,
    proximaTarefa,
    performance,
    agendaEventos,
    tarefasPendentes,
    mensagensRecentes,
    comunicados,
  ] = await Promise.all([
    getHeaderInfo(user),
    getHomeStats(user),
    getProximasAulas(user),
    getProximaTarefa(user),
    getPerformanceStats(user),
    getAgendaDoMes(user, new Date()),
    getTarefasPendentes(user),
    getMensagensRecentes(user),
    getComunicados(user),
  ]);

  return {
    alunoInfo,
    stats,
    proximasAulas,
    nextTask: proximaTarefa,
    performance,
    agendaEventos,
    tarefasPendentes,
    mensagensRecentes,
    comunicados,
  };
}

export const alunoDashboardService = {
  getDashboardData,
};
