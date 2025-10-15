import prisma from "../../utils/prisma";
import { AuthenticatedRequest } from "../../middlewares/auth";

/**
 * Busca os dados de estatísticas simples para os cards do dashboard.
 * - Conta alunos, professores e turmas vinculados à unidade escolar do gestor.
 */
async function getStats(user: AuthenticatedRequest["user"]) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário gestor não está vinculado a uma unidade escolar.");
  }
  const { unidadeEscolarId } = user;

  const [totalAlunos, totalProfessores, totalTurmas] =
    await prisma.$transaction([
      prisma.usuarios_aluno.count({
        where: { usuario: { unidadeEscolarId } },
      }),
      prisma.usuarios_professor.count({
        where: { usuario: { unidadeEscolarId } },
      }),
      prisma.turmas.count({
        where: { unidadeEscolarId },
      }),
    ]);

  return { totalAlunos, totalProfessores, totalTurmas };
}

/**
 * Busca os dados para os gráficos de desempenho e frequência, agrupados por turma.
 */
async function getChartData(user: AuthenticatedRequest["user"]) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário gestor não está vinculado a uma unidade escolar.");
  }
  const { unidadeEscolarId } = user;

  const avaliacoes = await prisma.avaliacaoParcial.findMany({
    where: {
      componenteCurricular: {
        turma: {
          unidadeEscolarId,
        },
      },
    },
    select: {
      nota: true,
      componenteCurricular: {
        select: {
          turmaId: true,
        },
      },
    },
  });

  const notasPorTurma = new Map<string, { soma: number; count: number }>();
  for (const av of avaliacoes) {
    const { turmaId } = av.componenteCurricular;
    if (!notasPorTurma.has(turmaId)) {
      notasPorTurma.set(turmaId, { soma: 0, count: 0 });
    }
    const turmaData = notasPorTurma.get(turmaId)!;
    turmaData.soma += av.nota;
    turmaData.count++;
  }

  const faltas = await prisma.registroFalta.findMany({
    where: {
      matricula: {
        turma: {
          unidadeEscolarId,
        },
      },
    },
    select: {
      matricula: {
        select: {
          turmaId: true,
        },
      },
    },
  });

  const faltasPorTurma = new Map<string, number>();
  for (const falta of faltas) {
    const { turmaId } = falta.matricula;
    faltasPorTurma.set(turmaId, (faltasPorTurma.get(turmaId) || 0) + 1);
  }

  const turmasDaUnidade = await prisma.turmas.findMany({
    where: { unidadeEscolarId },
    include: {
      _count: {
        select: { matriculas: true },
      },
    },
  });

  const DIAS_LETIVOS_NO_PERIODO = 20;

  const desempenhoTurmas: { nomeTurma: string; mediaNota: number }[] = [];
  const frequenciaTurmas: { nomeTurma: string; presencaPercentual: number }[] =
    [];

  for (const turma of turmasDaUnidade) {
    const nomeCompletoTurma = `${turma.serie} ${turma.nome}`;

    const dadosNota = notasPorTurma.get(turma.id);
    const mediaNota =
      dadosNota && dadosNota.count > 0 ? dadosNota.soma / dadosNota.count : 0;
    desempenhoTurmas.push({
      nomeTurma: nomeCompletoTurma,
      mediaNota: parseFloat(mediaNota.toFixed(1)),
    });

    const totalAlunos = turma._count.matriculas;
    const totalFaltas = faltasPorTurma.get(turma.id) || 0;
    const totalAulasPossiveis = totalAlunos * DIAS_LETIVOS_NO_PERIODO;
    const totalPresencas = totalAulasPossiveis - totalFaltas;
    const percPresenca =
      totalAulasPossiveis > 0
        ? (totalPresencas / totalAulasPossiveis) * 100
        : 100;
    frequenciaTurmas.push({
      nomeTurma: nomeCompletoTurma,
      presencaPercentual: parseFloat(percPresenca.toFixed(1)),
    });
  }

  return { desempenhoTurmas, frequenciaTurmas };
}

export const gestorDashboardService = {
  getStats,
  getChartData,
};
