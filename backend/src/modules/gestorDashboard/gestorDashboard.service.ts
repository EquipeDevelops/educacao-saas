import prisma from "../../utils/prisma";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { PeriodoAvaliacao, Usuarios, StatusPagamento } from "@prisma/client";

type UserPayload = Omit<Usuarios, "senha_hash">;

async function getHorarios(user: UserPayload) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário não vinculado a uma unidade escolar.");
  }
  return prisma.horarioAula.findMany({
    where: { unidadeEscolarId: user.unidadeEscolarId },
    include: {
      turma: { select: { id: true, nome: true, serie: true } },
      componenteCurricular: {
        include: {
          materia: { select: { nome: true } },
          professor: {
            include: { usuario: { select: { nome: true } } },
          },
        },
      },
    },
  });
}

async function getEventos(user: UserPayload) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário não vinculado a uma unidade escolar.");
  }
  return prisma.eventosCalendario.findMany({
    where: { unidadeEscolarId: user.unidadeEscolarId },
  });
}

async function getStats(user: UserPayload) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário não vinculado a uma unidade escolar.");
  }

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const [
    totalAlunos,
    totalProfessores,
    totalTurmas,
    receitas,
    despesas,
    inadimplencia,
  ] = await prisma.$transaction([
    prisma.usuarios_aluno.count({
      where: { usuario: { unidadeEscolarId: user.unidadeEscolarId } },
    }),
    prisma.usuarios_professor.count({
      where: { usuario: { unidadeEscolarId: user.unidadeEscolarId } },
    }),
    prisma.turmas.count({
      where: { unidadeEscolarId: user.unidadeEscolarId },
    }),
    prisma.transacao.aggregate({
      _sum: { valor: true },
      where: {
        unidadeEscolarId: user.unidadeEscolarId,
        tipo: "RECEITA",
        data: { gte: primeiroDiaMes, lte: ultimoDiaMes },
      },
    }),
    prisma.transacao.aggregate({
      _sum: { valor: true },
      where: {
        unidadeEscolarId: user.unidadeEscolarId,
        tipo: "DESPESA",
        data: { gte: primeiroDiaMes, lte: ultimoDiaMes },
      },
    }),
    prisma.mensalidade.aggregate({
      _sum: { valor: true },
      where: {
        unidadeEscolarId: user.unidadeEscolarId,
        status: { in: [StatusPagamento.PENDENTE, StatusPagamento.ATRASADO] },
        dataVencimento: { lt: new Date() },
      },
    }),
  ]);

  return {
    totalAlunos,
    totalProfessores,
    totalTurmas,
    receitaMes: receitas._sum.valor || 0,
    despesaMes: despesas._sum.valor || 0,
    inadimplencia: inadimplencia._sum.valor || 0,
  };
}

interface ChartDataFilters {
  ano?: number;
  periodo?: PeriodoAvaliacao;
}

async function getChartData(user: UserPayload, filters: ChartDataFilters) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário gestor não está vinculado a uma unidade escolar.");
  }
  const { unidadeEscolarId } = user;
  const { ano, periodo } = filters;
  const anoAlvo = ano || new Date().getFullYear();
  const inicioAno = new Date(`${anoAlvo}-01-01T00:00:00.000Z`);
  const fimAno = new Date(`${anoAlvo}-12-31T23:59:59.999Z`);

  const avaliacoesWhere: any = {
    componenteCurricular: {
      turma: { unidadeEscolarId },
      ano_letivo: anoAlvo,
    },
  };
  if (periodo) {
    avaliacoesWhere.periodo = periodo;
  }

  const [avaliacoes, submissoes, turmasDaUnidade, faltasAgrupadas] =
    await Promise.all([
      prisma.avaliacaoParcial.findMany({
        where: avaliacoesWhere,
        select: {
          nota: true,
          componenteCurricular: { select: { turmaId: true } },
        },
      }),
      prisma.submissoes.findMany({
        where: {
          unidadeEscolarId,
          status: "AVALIADA",
          nota_total: { not: null },
          tarefa: { componenteCurricular: { ano_letivo: anoAlvo } },
        },
        select: {
          nota_total: true,
          tarefa: {
            select: { componenteCurricular: { select: { turmaId: true } } },
          },
        },
      }),
      prisma.turmas.findMany({
        where: { unidadeEscolarId },
        include: {
          _count: {
            select: {
              matriculas: { where: { status: "ATIVA", ano_letivo: anoAlvo } },
            },
          },
        },
      }),
      prisma.registroFalta.groupBy({
        by: ["matriculaId", "justificada"],
        where: {
          matricula: { turma: { unidadeEscolarId } },
          data: { gte: inicioAno, lte: fimAno },
        },
      }),
    ]);

  const matriculasTurmaMap = await prisma.matriculas
    .findMany({
      where: {
        id: { in: faltasAgrupadas.map((f) => f.matriculaId) },
      },
      select: {
        id: true,
        turmaId: true,
      },
    })
    .then((matriculas) => new Map(matriculas.map((m) => [m.id, m.turmaId])));

  const faltasPorTurma = new Map<
    string,
    { justificadas: number; naoJustificadas: number }
  >();

  faltasAgrupadas.forEach((falta) => {
    const turmaId = matriculasTurmaMap.get(falta.matriculaId);
    if (!turmaId) return;

    const turmaData = faltasPorTurma.get(turmaId) || {
      justificadas: 0,
      naoJustificadas: 0,
    };
    if (falta.justificada) {
      turmaData.justificadas += 1;
    } else {
      turmaData.naoJustificadas += 1;
    }
    faltasPorTurma.set(turmaId, turmaData);
  });

  const notasPorTurma = new Map<string, { soma: number; count: number }>();
  avaliacoes.forEach((av) => {
    const { turmaId } = av.componenteCurricular;
    const turmaData = notasPorTurma.get(turmaId) || { soma: 0, count: 0 };
    turmaData.soma += av.nota;
    turmaData.count++;
    notasPorTurma.set(turmaId, turmaData);
  });
  submissoes.forEach((sub) => {
    if (sub.tarefa?.componenteCurricular?.turmaId) {
      const { turmaId } = sub.tarefa.componenteCurricular;
      const turmaData = notasPorTurma.get(turmaId) || { soma: 0, count: 0 };
      turmaData.soma += sub.nota_total!;
      turmaData.count++;
      notasPorTurma.set(turmaId, turmaData);
    }
  });

  const desempenhoTurmas: {
    turmaId: string;
    nomeTurma: string;
    mediaNota: number;
  }[] = [];
  const frequenciaTurmas: {
    nomeTurma: string;
    presenca: number;
    justificadas: number;
    naoJustificadas: number;
  }[] = [];

  const AULAS_NO_PERIODO_PARA_CALCULO = 200;

  for (const turma of turmasDaUnidade) {
    const nomeCompletoTurma = `${turma.serie} ${turma.nome}`;

    const dadosNota = notasPorTurma.get(turma.id);
    const mediaNota =
      dadosNota && dadosNota.count > 0 ? dadosNota.soma / dadosNota.count : 0;
    desempenhoTurmas.push({
      turmaId: turma.id,
      nomeTurma: nomeCompletoTurma,
      mediaNota: parseFloat(mediaNota.toFixed(1)),
    });

    const totalAlunos = turma._count.matriculas;
    const dadosFalta = faltasPorTurma.get(turma.id) || {
      justificadas: 0,
      naoJustificadas: 0,
    };

    if (totalAlunos > 0) {
      const totalAulasPossiveis = totalAlunos * AULAS_NO_PERIODO_PARA_CALCULO;
      const totalFaltas = dadosFalta.justificadas + dadosFalta.naoJustificadas;

      const percNaoJustificadas =
        (dadosFalta.naoJustificadas / totalAulasPossiveis) * 100;
      const percJustificadas =
        (dadosFalta.justificadas / totalAulasPossiveis) * 100;
      const percPresenca = 100 - (percNaoJustificadas + percJustificadas);

      frequenciaTurmas.push({
        nomeTurma: nomeCompletoTurma,
        presenca: parseFloat(Math.max(0, percPresenca).toFixed(1)),
        justificadas: parseFloat(percJustificadas.toFixed(1)),
        naoJustificadas: parseFloat(percNaoJustificadas.toFixed(1)),
      });
    } else {
      frequenciaTurmas.push({
        nomeTurma: nomeCompletoTurma,
        presenca: 100,
        justificadas: 0,
        naoJustificadas: 0,
      });
    }
  }

  return { desempenhoTurmas, frequenciaTurmas };
}

async function getDesempenhoPorMateria(
  user: UserPayload,
  turmaId: string,
  filters: ChartDataFilters
) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário gestor não está vinculado a uma unidade escolar.");
  }

  const { ano, periodo } = filters;
  const anoAlvo = ano || new Date().getFullYear();

  const whereClause: any = {
    componenteCurricular: {
      turmaId: turmaId,
      ano_letivo: anoAlvo,
    },
  };

  if (periodo) {
    whereClause.periodo = periodo;
  }

  const avaliacoes = await prisma.avaliacaoParcial.findMany({
    where: whereClause,
    select: {
      nota: true,
      componenteCurricular: {
        select: {
          materia: { select: { nome: true } },
        },
      },
    },
  });

  const notasPorMateria = new Map<string, { soma: number; count: number }>();

  avaliacoes.forEach((av) => {
    const nomeMateria = av.componenteCurricular.materia.nome;
    const materiaData = notasPorMateria.get(nomeMateria) || {
      soma: 0,
      count: 0,
    };
    materiaData.soma += av.nota;
    materiaData.count++;
    notasPorMateria.set(nomeMateria, materiaData);
  });

  const desempenhoMaterias = Array.from(notasPorMateria.entries()).map(
    ([nomeMateria, data]) => ({
      nomeMateria,
      mediaNota: parseFloat((data.soma / data.count).toFixed(1)),
    })
  );

  return desempenhoMaterias;
}

export const gestorDashboardService = {
  getHorarios,
  getEventos,
  getStats,
  getChartData,
  getDesempenhoPorMateria,
};
