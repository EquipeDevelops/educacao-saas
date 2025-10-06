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

async function getHeaderInfo(user: AuthenticatedRequest["user"]) {
  const professorId = user.perfilId;
  if (!professorId || !user.unidadeEscolarId) {
    throw new Error(
      "Usuário não é um professor ou não está vinculado a uma unidade escolar."
    );
  }

  const [componentes, unidadeEscolar, unreadMessages] = await Promise.all([
    prisma.componenteCurricular.findMany({
      where: { professorId },
      select: {
        materia: { select: { nome: true } },
        turma: { select: { serie: true } },
      },
      distinct: ["materiaId", "turmaId"],
      take: 2,
    }),
    prisma.unidades_Escolares.findUnique({
      where: { id: user.unidadeEscolarId },
      select: { nome: true },
    }),
    prisma.conversa.count({
      where: {
        participantes: { some: { usuarioId: user.id } },
        atualizado_em: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    }),
  ]);

  const userDetails = componentes
    .map((c) => `${c.materia.nome} - ${c.turma.serie}`)
    .join(" | ");

  const schoolName = unidadeEscolar?.nome || "Escola não encontrada";

  return {
    userDetails: `${userDetails} | ${schoolName}`,
    notificationCount: unreadMessages,
  };
}

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
        turmaId: componente.turma.id,
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
      id: true,
      materia: { select: { nome: true } },
      turma: { select: { id: true, nome: true, serie: true } },
    },
  });

  const turmaId = componente.turma.id;

  const [matriculas, tarefas] = await Promise.all([
    prisma.matriculas.findMany({
      where: { turmaId: turmaId, status: "ATIVA" },
      select: {
        id: true,
        aluno: { select: { id: true, usuario: { select: { nome: true } } } },
      },
    }),
    prisma.tarefas.findMany({
      where: { componenteCurricularId: componenteId },
      include: { _count: { select: { submissoes: true } } },
    }),
  ]);

  const alunos = await Promise.all(
    matriculas.map(async (m) => {
      const [avaliacoesParciais, submissoesAvaliadas] = await Promise.all([
        prisma.avaliacaoParcial.findMany({
          where: {
            matriculaId: m.id,
            componenteCurricularId: componente.id,
          },
          select: { nota: true },
        }),
        prisma.submissoes.findMany({
          where: {
            alunoId: m.aluno.id,
            tarefa: { componenteCurricularId: componente.id },
            status: StatusSubmissao.AVALIADA,
            nota_total: { not: null },
          },
          select: { nota_total: true },
        }),
      ]);

      const todasAsNotas = [
        ...avaliacoesParciais.map((a) => a.nota),
        ...submissoesAvaliadas.map((s) => s.nota_total!),
      ];

      const media =
        todasAsNotas.length > 0
          ? todasAsNotas.reduce((acc, nota) => acc + nota, 0) /
            todasAsNotas.length
          : 0;

      const totalFaltas = await prisma.registroFalta.count({
        where: { matriculaId: m.id },
      });
      const DIAS_LETIVOS_TOTAIS = 100;
      const presenca = Math.max(
        0,
        ((DIAS_LETIVOS_TOTAIS - totalFaltas) / DIAS_LETIVOS_TOTAIS) * 100
      );

      return {
        id: m.aluno.id,
        nome: m.aluno.usuario.nome,
        media: parseFloat(media.toFixed(1)),
        presenca: Math.round(presenca),
        status:
          media < 6 || presenca < 75
            ? "Atenção"
            : ("Ativo" as "Ativo" | "Atenção"),
      };
    })
  );

  const atividades = tarefas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    tipo: t.tipo,
    data_entrega: t.data_entrega,
    entregas: t._count.submissoes,
    total: matriculas.length,
  }));

  const todasAsNotasDaTurma = alunos.map((a) => a.media).filter((m) => m > 0);

  const mediaGeral =
    todasAsNotasDaTurma.length > 0
      ? todasAsNotasDaTurma.reduce((a, b) => a + b, 0) /
        todasAsNotasDaTurma.length
      : 0;

  const distribuicao = [
    {
      range: "9.0 - 10.0",
      alunos: todasAsNotasDaTurma.filter((n) => n >= 9).length,
    },
    {
      range: "7.0 - 8.9",
      alunos: todasAsNotasDaTurma.filter((n) => n >= 7 && n < 9).length,
    },
    {
      range: "5.0 - 6.9",
      alunos: todasAsNotasDaTurma.filter((n) => n >= 5 && n < 7).length,
    },
    {
      range: "0.0 - 4.9",
      alunos: todasAsNotasDaTurma.filter((n) => n < 5).length,
    },
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
    headerInfo: {
      nomeTurma: `${componente.turma.serie} ${componente.turma.nome}`,
      materia: componente.materia.nome,
      horarioResumo: horarioResumo || "N/D",
      mediaGeral: estatisticas.mediaGeral,
    },
    alunos,
    atividades,
    estatisticas,
  };
}

async function getMyStudents(user: AuthenticatedRequest["user"]) {
  const professorId = user.perfilId;
  if (!professorId) return [];

  const componentes = await prisma.componenteCurricular.findMany({
    where: { professorId },
    select: { turmaId: true },
  });
  const turmaIds = [...new Set(componentes.map((c) => c.turmaId))];

  const matriculas = await prisma.matriculas.findMany({
    where: {
      turmaId: { in: turmaIds },
      status: "ATIVA",
    },
    select: {
      aluno: {
        select: {
          usuario: {
            select: { id: true, nome: true, papel: true },
          },
        },
      },
    },
    orderBy: { aluno: { usuario: { nome: "asc" } } },
  });

  const studentMap = new Map();
  matriculas.forEach((m) => {
    if (!studentMap.has(m.aluno.usuario.id)) {
      studentMap.set(m.aluno.usuario.id, m.aluno.usuario);
    }
  });

  return Array.from(studentMap.values());
}

/**
 * NOVO: Busca uma lista de todos os outros professores na mesma escola.
 */
async function getColleagues(user: AuthenticatedRequest["user"]) {
  const professorId = user.perfilId;
  if (!professorId || !user.unidadeEscolarId) return [];

  const professores = await prisma.usuarios_professor.findMany({
    where: {
      componentes_lecionados: {
        some: {
          turma: {
            unidadeEscolarId: user.unidadeEscolarId,
          },
        },
      },
      id: { not: professorId },
    },
    select: {
      usuario: {
        select: { id: true, nome: true, papel: true },
      },
    },
    distinct: ["usuarioId"],
    orderBy: {
      usuario: {
        nome: "asc",
      },
    },
  });

  return professores.map((p) => p.usuario);
}

export const professorDashboardService = {
  getColleagues,
  getMyStudents,
  getHeaderInfo,
  getHomeStats,
  getAtividadesPendentes,
  getDesempenhoTurmas,
  getTurmasDashboard,
  getCorrecoesDashboard,
  getTurmaDetails,
};
