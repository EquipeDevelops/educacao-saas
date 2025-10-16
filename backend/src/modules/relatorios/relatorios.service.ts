import prisma from "../../utils/prisma";
import { PeriodoAvaliacao, Usuarios } from "@prisma/client";

type UserPayload = Omit<Usuarios, "senha_hash">;

interface BoletimFilters {
  turmaId: string;
  periodo: PeriodoAvaliacao;
  ano: number;
}

interface FrequenciaFilters {
  turmaId: string;
  dataInicio: Date;
  dataFim: Date;
}

function countWeekdays(start: Date, end: Date): { [key: number]: number } {
  const counts: { [key: number]: number } = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  };
  let current = new Date(start);

  while (current <= end) {
    counts[current.getDay()]++;
    current.setDate(current.getDate() + 1);
  }
  return counts;
}

async function getFrequenciaDetalhadaPorTurma(
  user: UserPayload,
  filters: FrequenciaFilters
) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário não vinculado a uma unidade escolar.");
  }

  const { turmaId, dataInicio, dataFim } = filters;

  // 1. Buscar horários e matrículas da turma
  const [horarios, matriculas] = await Promise.all([
    prisma.horarioAula.findMany({ where: { turmaId } }),
    prisma.matriculas.findMany({
      where: { turmaId, status: "ATIVA" },
      select: {
        id: true,
        aluno: { select: { usuario: { select: { id: true, nome: true } } } },
      },
      orderBy: { aluno: { usuario: { nome: "asc" } } },
    }),
  ]);

  if (matriculas.length === 0) return [];

  // 2. Calcular o total de aulas no período
  const weekdayCounts = countWeekdays(dataInicio, dataFim);
  const aulasPorDia = horarios.reduce((acc, horario) => {
    // Convertendo o enum DiaDaSemana para o número do dia (Domingo=0, Segunda=1, etc.)
    const diaNum = [
      "DOMINGO",
      "SEGUNDA",
      "TERCA",
      "QUARTA",
      "QUINTA",
      "SEXTA",
      "SABADO",
    ].indexOf(horario.dia_semana);
    if (diaNum !== -1) {
      acc[diaNum] = (acc[diaNum] || 0) + 1;
    }
    return acc;
  }, {} as { [key: number]: number });

  let totalAulasNoPeriodo = 0;
  for (const dayNum in weekdayCounts) {
    totalAulasNoPeriodo += (aulasPorDia[dayNum] || 0) * weekdayCounts[dayNum];
  }

  // 3. Buscar as faltas de todos os alunos da turma no período
  const matriculaIds = matriculas.map((m) => m.id);
  const faltasAgrupadas = await prisma.registroFalta.groupBy({
    by: ["matriculaId", "justificada"],
    where: {
      matriculaId: { in: matriculaIds },
      data: { gte: dataInicio, lte: dataFim },
    },
    _count: { id: true },
  });

  // 4. Montar o relatório final
  const relatorio = matriculas.map((matricula) => {
    const faltasJustificadas =
      faltasAgrupadas.find(
        (f) => f.matriculaId === matricula.id && f.justificada
      )?._count.id || 0;
    const faltasNaoJustificadas =
      faltasAgrupadas.find(
        (f) => f.matriculaId === matricula.id && !f.justificada
      )?._count.id || 0;
    const totalFaltas = faltasJustificadas + faltasNaoJustificadas;
    const totalPresencas = totalAulasNoPeriodo - totalFaltas;
    const percentualFrequencia =
      totalAulasNoPeriodo > 0
        ? (totalPresencas / totalAulasNoPeriodo) * 100
        : 100;

    return {
      aluno: {
        id: matricula.aluno.usuario.id,
        nome: matricula.aluno.usuario.nome,
      },
      totalAulas: totalAulasNoPeriodo,
      totalPresencas,
      totalFaltas,
      faltasJustificadas,
      faltasNaoJustificadas,
      percentualFrequencia: parseFloat(
        Math.max(0, percentualFrequencia).toFixed(1)
      ),
    };
  });

  return relatorio;
}

async function getBoletimPorTurma(user: UserPayload, filters: BoletimFilters) {
  if (!user.unidadeEscolarId) {
    throw new Error("Usuário não vinculado a uma unidade escolar.");
  }

  const { turmaId, periodo, ano } = filters;

  const matriculas = await prisma.matriculas.findMany({
    where: {
      turmaId,
      status: "ATIVA",
      ano_letivo: ano,
    },
    select: {
      id: true,
      aluno: {
        select: {
          usuario: {
            select: { id: true, nome: true },
          },
        },
      },
    },
    orderBy: {
      aluno: { usuario: { nome: "asc" } },
    },
  });

  if (matriculas.length === 0) {
    return [];
  }

  const matriculaIds = matriculas.map((m) => m.id);

  const [avaliacoes, faltas] = await Promise.all([
    prisma.avaliacaoParcial.findMany({
      where: {
        matriculaId: { in: matriculaIds },
        periodo: periodo,
      },
      select: {
        nota: true,
        matriculaId: true,
        componenteCurricular: {
          select: {
            materia: { select: { nome: true } },
          },
        },
      },
    }),
    prisma.registroFalta.groupBy({
      by: ["matriculaId"],
      where: {
        matriculaId: { in: matriculaIds },
      },
      _count: {
        id: true,
      },
    }),
  ]);

  const boletins = matriculas.map((matricula) => {
    const nomeAluno = matricula.aluno.usuario.nome;
    const avaliacoesDoAluno = avaliacoes.filter(
      (av) => av.matriculaId === matricula.id
    );
    const faltasDoAluno = faltas.find((f) => f.matriculaId === matricula.id);

    const notasPorMateria = new Map<
      string,
      { notas: number[]; media: number }
    >();

    avaliacoesDoAluno.forEach((av) => {
      if (av.componenteCurricular && av.componenteCurricular.materia) {
        const materia = av.componenteCurricular.materia.nome;
        const notasData = notasPorMateria.get(materia) || {
          notas: [],
          media: 0,
        };

        notasData.notas.push(av.nota);
        const novaMedia =
          notasData.notas.reduce((acc, n) => acc + n, 0) /
          notasData.notas.length;

        notasPorMateria.set(materia, {
          notas: notasData.notas,
          media: novaMedia,
        });
      }
    });

    return {
      aluno: {
        id: matricula.aluno.usuario.id,
        nome: nomeAluno,
      },
      disciplinas: Array.from(notasPorMateria.entries()).map(
        ([nome, data]) => ({
          nome: nome,
          mediaFinal: parseFloat(data.media.toFixed(1)),
        })
      ),
      totalFaltas: faltasDoAluno?._count.id || 0,
    };
  });

  return boletins;
}

export const relatoriosService = {
  getBoletimPorTurma,
  getFrequenciaDetalhadaPorTurma,
};
