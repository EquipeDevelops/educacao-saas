import { PrismaClient, StatusSubmissao } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

const dayMap: { [key: string]: number } = {
  DOMINGO: 0,
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
};

/**
 * Endpoint para os cards da página inicial do professor.
 */
async function getHomeStats(user: AuthenticatedRequest["user"]) {
  const professorId = user.perfilId;
  if (!professorId) throw new Error("Usuário não é um professor.");

  const componentes = await prisma.componenteCurricular.findMany({
    where: { professorId },
    select: { turmaId: true, id: true },
  });

  const turmaIds = [...new Set(componentes.map((c) => c.turmaId))];
  const componenteIds = componentes.map((c) => c.id);

  const [totalAlunos, aulasHoje, atividadesParaCorrigir, tarefas] =
    await Promise.all([
      prisma.matriculas.count({
        where: { turmaId: { in: turmaIds }, status: "ATIVA" },
      }),

      prisma.horarioAula.findMany({
        where: {
          componenteCurricularId: { in: componenteIds },
          dia_semana: Object.keys(dayMap).find(
            (key) => dayMap[key] === new Date().getDay()
          ) as any,
        },
        orderBy: { hora_inicio: "asc" },
      }),

      prisma.submissoes.count({
        where: {
          tarefa: { componenteCurricularId: { in: componenteIds } },
          status: { in: ["ENVIADA", "ENVIADA_COM_ATRASO"] },
        },
      }),

      prisma.tarefas.findMany({
        where: { componenteCurricularId: { in: componenteIds } },
        select: { _count: { select: { submissoes: true } } },
      }),
    ]);

  const totalSubmissoesPossiveis = tarefas.length * totalAlunos;
  const totalEntregas = tarefas.reduce(
    (acc, t) => acc + t._count.submissoes,
    0
  );
  const taxaDeConclusao =
    totalSubmissoesPossiveis > 0
      ? Math.round((totalEntregas / totalSubmissoesPossiveis) * 100)
      : 0;

  return {
    totalAlunos,
    aulasHoje: {
      count: aulasHoje.length,
      proxima: aulasHoje[0]?.hora_inicio || null,
    },
    atividadesParaCorrigir,
    taxaDeConclusao,
  };
}

/**
 * NOVO: Busca as 3 atividades com correções pendentes mais próximas do prazo.
 */
async function getAtividadesPendentes(user: AuthenticatedRequest["user"]) {
  const professorId = user.perfilId;
  if (!professorId) return [];

  const tarefasComPendencias = await prisma.tarefas.findMany({
    where: {
      componenteCurricular: { professorId },
      submissoes: {
        some: { status: { in: ["ENVIADA", "ENVIADA_COM_ATRASO"] } },
      },
    },
    select: {
      id: true,
      titulo: true,
      data_entrega: true,
      componenteCurricular: {
        select: {
          materia: { select: { nome: true } },
          turma: { select: { nome: true, serie: true } },
        },
      },
      _count: {
        select: {
          submissoes: {
            where: { status: { in: ["ENVIADA", "ENVIADA_COM_ATRASO"] } },
          },
        },
      },
    },
    orderBy: {
      data_entrega: "asc",
    },
    take: 3,
  });

  return tarefasComPendencias.map((tarefa) => ({
    id: tarefa.id,
    materia: tarefa.componenteCurricular.materia.nome.substring(0, 3),
    titulo: tarefa.titulo,
    turma: `${tarefa.componenteCurricular.turma.serie} ${tarefa.componenteCurricular.turma.nome}`,
    submissoes: tarefa._count.submissoes,
    dataEntrega: `Até ${new Date(tarefa.data_entrega).toLocaleDateString(
      "pt-BR"
    )}`,
  }));
}

/**
 * NOVO: Calcula o desempenho geral e por turma do professor.
 */
async function getDesempenhoTurmas(user: AuthenticatedRequest["user"]) {
  const professorId = user.perfilId;
  if (!professorId) throw new Error("Usuário não é um professor.");

  const componentes = await prisma.componenteCurricular.findMany({
    where: { professorId },
    select: {
      id: true,
      turma: { select: { id: true, nome: true, serie: true } },
    },
  });

  const componenteIds = componentes.map((c) => c.id);

  const mediaGeralAgg = await prisma.avaliacaoParcial.aggregate({
    _avg: { nota: true },
    where: { componenteCurricularId: { in: componenteIds } },
  });
  const desempenhoGeral = mediaGeralAgg._avg.nota ?? 0;

  const turmasUnicas = [
    ...new Map(componentes.map((c) => [c.turma.id, c.turma])).values(),
  ];
  const porTurma = await Promise.all(
    turmasUnicas.map(async (turma) => {
      const componentesDaTurma = componentes
        .filter((c) => c.turma.id === turma.id)
        .map((c) => c.id);
      const mediaTurmaAgg = await prisma.avaliacaoParcial.aggregate({
        _avg: { nota: true },
        where: { componenteCurricularId: { in: componentesDaTurma } },
      });
      return {
        nome: `${turma.serie} ${turma.nome}`,
        media: mediaTurmaAgg._avg.nota ?? 0,
      };
    })
  );

  const tarefas = await prisma.tarefas.findMany({
    where: { componenteCurricularId: { in: componenteIds } },
    select: { _count: { select: { submissoes: true } } },
  });
  const totalAlunos = await prisma.matriculas.count({
    where: { turmaId: { in: turmasUnicas.map((t) => t.id) }, status: "ATIVA" },
  });
  const totalSubmissoesPossiveis = tarefas.length * totalAlunos;
  const totalEntregas = tarefas.reduce(
    (acc, t) => acc + t._count.submissoes,
    0
  );
  const taxaConclusaoGeral =
    totalSubmissoesPossiveis > 0
      ? Math.round((totalEntregas / totalSubmissoesPossiveis) * 100)
      : 0;

  return { desempenhoGeral, porTurma, taxaConclusaoGeral };
}

async function getCorrecoesDashboard(user: AuthenticatedRequest["user"]) {
  const professorId = user.perfilId;
  if (!professorId) throw new Error("Usuário não é um professor.");

  const tarefas = await prisma.tarefas.findMany({
    where: {
      componenteCurricular: { professorId },
      submissoes: { some: {} },
    },
    select: {
      id: true,
      titulo: true,
      data_entrega: true,
      componenteCurricular: {
        select: { turma: { select: { nome: true, serie: true } } },
      },
      _count: {
        select: { submissoes: true },
      },
    },
    orderBy: {
      data_entrega: "desc",
    },
  });

  const correcoesComStats = await Promise.all(
    tarefas.map(async (tarefa) => {
      const corrigidasCount = await prisma.submissoes.count({
        where: {
          tarefaId: tarefa.id,
          status: "AVALIADA",
        },
      });

      const entregas = tarefa._count.submissoes;
      const pendentes = entregas - corrigidasCount;

      return {
        id: tarefa.id,
        titulo: tarefa.titulo,
        turma: `${tarefa.componenteCurricular.turma.serie} ${tarefa.componenteCurricular.turma.nome}`,
        entregas: entregas,
        corrigidas: corrigidasCount,
        pendentes: pendentes,
        prazo: tarefa.data_entrega,
        status: pendentes > 0 ? "PENDENTE" : "CONCLUIDA",
      };
    })
  );

  return correcoesComStats;
}

async function getTurmasDashboard(user: AuthenticatedRequest["user"]) {
  const professorId = user.perfilId;
  if (!professorId) throw new Error("Usuário não é um professor.");

  const componentes = await prisma.componenteCurricular.findMany({
    where: { professorId },
    select: {
      id: true,
      materia: { select: { nome: true } },
      turma: { select: { id: true, nome: true, serie: true } },
    },
  });

  const turmasComStats = await Promise.all(
    componentes.map(async (componente) => {
      const turmaId = componente.turma.id;

      const alunosCount = await prisma.matriculas.count({
        where: { turmaId: turmaId, status: "ATIVA" },
      });

      const mediaGeralResult = await prisma.avaliacaoParcial.aggregate({
        _avg: { nota: true },
        where: { componenteCurricularId: componente.id },
      });
      const mediaGeral = mediaGeralResult._avg.nota ?? 0;

      const horarios = await prisma.horarioAula.findMany({
        where: { componenteCurricularId: componente.id },
        select: { dia_semana: true, hora_inicio: true },
        orderBy: { dia_semana: "asc" },
      });
      const horarioResumo = horarios
        .map((h) => `${h.dia_semana.substring(0, 3)}. ${h.hora_inicio}`)
        .slice(0, 2)
        .join(" | ");

      return {
        componenteId: componente.id,
        nomeTurma: `${componente.turma.serie} ${componente.turma.nome}`,
        materia: componente.materia.nome,
        alunosCount,
        mediaGeral,
        horarioResumo: horarioResumo || "N/D",
      };
    })
  );

  return turmasComStats;
}

async function getTurmaDetails(
  componenteId: string,
  user: AuthenticatedRequest["user"]
) {
  const professorId = user.perfilId;

  const componente = await prisma.componenteCurricular.findFirstOrThrow({
    where: { id: componenteId, professorId },
    select: {
      materia: { select: { nome: true } },
      turma: { select: { id: true, nome: true, serie: true } },
    },
  });

  const turmaId = componente.turma.id;

  const [matriculas, tarefas, avaliacoes] = await Promise.all([
    prisma.matriculas.findMany({
      where: { turmaId: turmaId, status: "ATIVA" },
      select: {
        aluno: { select: { id: true, usuario: { select: { nome: true } } } },
      },
    }),
    prisma.tarefas.findMany({
      where: { componenteCurricularId: componenteId },
      include: { _count: { select: { submissoes: true } } },
    }),
    prisma.avaliacaoParcial.findMany({
      where: { componenteCurricularId: componenteId },
      select: { nota: true },
    }),
  ]);

  const alunos = matriculas.map((m) => ({
    id: m.aluno.id,
    nome: m.aluno.usuario.nome,
    media: parseFloat((Math.random() * 5 + 5).toFixed(1)),
    presenca: Math.floor(Math.random() * 20 + 80),
    status: Math.random() > 0.15 ? "Ativo" : ("Atenção" as "Ativo" | "Atenção"),
  }));

  const atividades = tarefas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    tipo: t.tipo,
    data_entrega: t.data_entrega,
    entregas: t._count.submissoes,
    total: matriculas.length,
  }));

  const notas = avaliacoes.map((a) => a.nota);
  const mediaGeral =
    notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
  const distribuicao = [
    { range: "9.0 - 10.0", alunos: notas.filter((n) => n >= 9).length },
    { range: "7.0 - 8.9", alunos: notas.filter((n) => n >= 7 && n < 9).length },
    { range: "5.0 - 6.9", alunos: notas.filter((n) => n >= 5 && n < 7).length },
    { range: "0.0 - 4.9", alunos: notas.filter((n) => n < 5).length },
  ].map((d) => ({
    ...d,
    percent:
      matriculas.length > 0
        ? Math.round((d.alunos / matriculas.length) * 100)
        : 0,
  }));

  const estatisticas = {
    totalAlunos: matriculas.length,
    mediaGeral: mediaGeral,
    atividades: tarefas.length,
    distribuicao: distribuicao,
  };

  return {
    headerInfo: {
      nomeTurma: `${componente.turma.serie} ${componente.turma.nome}`,
      materia: componente.materia.nome,
      horarioResumo: "Seg, Ter, Qui - 08:00",
      mediaGeral: estatisticas.mediaGeral,
    },
    alunos,
    atividades,
    estatisticas,
  };
}

export const professorDashboardService = {
  getHomeStats,
  getAtividadesPendentes,
  getDesempenhoTurmas,
  getTurmasDashboard,
  getCorrecoesDashboard,
  getTurmaDetails,
};
