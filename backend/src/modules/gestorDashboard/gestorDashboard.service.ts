import {
  PrismaClient,
  PapelUsuario,
  StatusPagamento,
  SituacaoPresenca,
} from "@prisma/client";

const prisma = new PrismaClient();

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface DashboardStats {
  totalAlunos: number;
  totalProfessores: number;
  receitaMensal: number;
  inadimplencia: number;
}

async function getStats(
  unidadeEscolarId: string,
  prismaClient: PrismaTransactionClient = prisma
): Promise<DashboardStats> {
  const totalAlunos = await prismaClient.usuarios.count({
    where: { unidadeEscolarId, papel: PapelUsuario.ALUNO, status: true },
  });

  const totalProfessores = await prismaClient.usuarios.count({
    where: { unidadeEscolarId, papel: PapelUsuario.PROFESSOR, status: true },
  });

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const pagamentosMensalidade = await prismaClient.mensalidade.aggregate({
    _sum: { valor: true },
    where: {
      unidadeEscolarId,
      status: StatusPagamento.PAGO,
      dataPagamento: { gte: primeiroDiaMes, lte: ultimoDiaMes },
    },
  });

  const mensalidadesVencidas = await prismaClient.mensalidade.count({
    where: {
      unidadeEscolarId,
      dataVencimento: { lt: hoje },
      status: { not: StatusPagamento.PAGO },
    },
  });

  const totalMensalidadesAteHoje = await prismaClient.mensalidade.count({
    where: {
      unidadeEscolarId,
      dataVencimento: { lt: hoje },
    },
  });

  let taxaInadimplencia = 0;
  if (totalMensalidadesAteHoje > 0) {
    taxaInadimplencia = (mensalidadesVencidas / totalMensalidadesAteHoje) * 100;
  }

  return {
    totalAlunos,
    totalProfessores,
    receitaMensal: pagamentosMensalidade._sum.valor || 0,
    inadimplencia: parseFloat(taxaInadimplencia.toFixed(2)),
  };
}

async function getPerformance(
  unidadeEscolarId: string,
  prismaClient: PrismaTransactionClient = prisma
) {
  const avaliacoes = await prismaClient.avaliacaoParcial.findMany({
    where: {
      componenteCurricular: {
        turma: { unidadeEscolarId },
      },
    },
    include: {
      componenteCurricular: {
        include: { materia: true },
      },
    },
  });

  const materiasMap: Record<string, { total: number; count: number }> = {};

  avaliacoes.forEach((av) => {
    const materia = av.componenteCurricular.materia.nome;
    if (!materiasMap[materia]) {
      materiasMap[materia] = { total: 0, count: 0 };
    }
    materiasMap[materia].total += av.nota;
    materiasMap[materia].count++;
  });

  const performanceData = Object.entries(materiasMap).map(
    ([materia, data]) => ({
      subject: materia,
      A: parseFloat((data.total / data.count).toFixed(1)),
      fullMark: 10,
    })
  );

  return performanceData.sort((a, b) => b.A - a.A).slice(0, 6);
}

async function getAttendance(
  unidadeEscolarId: string,
  prismaClient: PrismaTransactionClient = prisma
) {
  const hoje = new Date();
  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(hoje.getMonth() - 5);
  seisMesesAtras.setDate(1);

  const presencas = await prismaClient.diarioAulaPresenca.findMany({
    where: {
      diarioAula: {
        unidadeEscolarId,
        data: { gte: seisMesesAtras },
      },
    },
    include: {
      diarioAula: {
        select: { data: true },
      },
    },
  });

  const attendanceMap: Record<string, { total: number; presentes: number }> =
    {};

  for (let i = 0; i < 6; i++) {
    const d = new Date(seisMesesAtras);
    d.setMonth(d.getMonth() + i);
    const mesKey = d.toLocaleString("pt-BR", { month: "short" });
    attendanceMap[mesKey] = { total: 0, presentes: 0 };
  }

  presencas.forEach((p) => {
    const mesKey = p.diarioAula.data.toLocaleString("pt-BR", {
      month: "short",
    });
    if (attendanceMap[mesKey]) {
      attendanceMap[mesKey].total++;
      if (p.situacao === SituacaoPresenca.PRESENTE) {
        attendanceMap[mesKey].presentes++;
      }
    }
  });

  const chartData = Object.entries(attendanceMap).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    presentes:
      data.total > 0
        ? parseFloat(((data.presentes / data.total) * 100).toFixed(1))
        : 0,
  }));

  return chartData;
}

export const gestorDashboardService = {
  getStats,
  getPerformance,
  getAttendance,
};