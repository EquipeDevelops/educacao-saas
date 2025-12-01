import { PrismaClient, StatusSubmissao } from '@prisma/client';
import { AuthenticatedRequest } from '../../middlewares/auth';
import HorarioAulaService from '../horarioAula/horarioAula.service';
import { conversaService } from '../conversa/conversa.service';

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

type AlunoStatus = 'Excelente' | 'Bom' | 'Ruim';

function calcularStatusAluno(media: number, presenca: number): AlunoStatus {
  if (media >= 8 && presenca >= 90) {
    return 'Excelente';
  }
  if (media >= 6 && presenca >= 75) {
    return 'Bom';
  }
  return 'Ruim';
}

async function getProfessorProfile(user: AuthenticatedRequest['user']) {
  if (!user.id) {
    throw new Error('Usuário não encontrado.');
  }

  const professor = await prisma.usuarios.findUnique({
    where: { id: user.id },
    select: {
      nome: true,
      email: true,
      unidade_escolar: { select: { nome: true } },
      perfil_professor: {
        select: {
          titulacao: true,
          area_especializacao: true,
        },
      },
    },
  });

  if (!professor) {
    throw new Error('Usuário não encontrado.');
  }

  return {
    nome: professor.nome,
    email: professor.email,
    unidadeEscolar: professor.unidade_escolar?.nome ?? null,
    titulacao: professor.perfil_professor?.titulacao ?? null,
    areaEspecializacao: professor.perfil_professor?.area_especializacao ?? null,
  };
}

async function getHeaderInfo(user: AuthenticatedRequest['user']) {
  const professorId = user.perfilId;
  if (!professorId || !user.unidadeEscolarId) {
    throw new Error(
      'Usuário não é um professor ou não está vinculado a uma unidade escolar.',
    );
  }

  const [componentes, unidadeEscolar] = await Promise.all([
    prisma.componenteCurricular.findMany({
      where: { professorId },
      select: {
        materia: { select: { nome: true } },
        turma: { select: { serie: true, nome: true } },
      },
      distinct: ['materiaId', 'turmaId'],
    }),
    prisma.unidades_Escolares.findUnique({
      where: { id: user.unidadeEscolarId },
      select: { nome: true },
    }),
  ]);

  const turmas = componentes
    .map(
      (c) =>
        `${c.materia.nome} - ${c.turma.serie}${
          c.turma.nome ? ` ${c.turma.nome}` : ''
        }`,
    )
    .filter((value, index, self) => self.indexOf(value) === index);

  const schoolName = unidadeEscolar?.nome || null;

  return {
    turmas,
    unidadeEscolar: schoolName,
    notificationCount: 0,
  };
}

async function getHomeStats(user: AuthenticatedRequest['user']) {
  const professorId = user.perfilId;
  if (!professorId) throw new Error('Usuário não é um professor.');

  const componentes = await prisma.componenteCurricular.findMany({
    where: { professorId },
    select: { turmaId: true, id: true },
  });

  if (componentes.length === 0) {
    return {
      totalAlunos: 0,
      aulasHoje: { count: 0, proxima: null },
      atividadesParaCorrigir: 0,
      taxaDeConclusao: 0,
    };
  }

  const turmaIds = [...new Set(componentes.map((c) => c.turmaId))];
  const componenteIds = componentes.map((c) => c.id);

  const [totalAlunos, aulasHoje, atividadesParaCorrigir, tarefasComAlunos] =
    await Promise.all([
      prisma.matriculas.count({
        where: { turmaId: { in: turmaIds }, status: 'ATIVA' },
      }),
      prisma.horarioAula.findMany({
        where: {
          componenteCurricularId: { in: componenteIds },
          dia_semana: Object.keys(dayMap).find(
            (key) => dayMap[key] === new Date().getDay(),
          ) as any,
        },
        orderBy: { hora_inicio: 'asc' },
      }),
      prisma.submissoes.count({
        where: {
          tarefa: { componenteCurricularId: { in: componenteIds } },
          status: { in: ['ENVIADA', 'ENVIADA_COM_ATRASO'] },
        },
      }),
      prisma.tarefas.findMany({
        where: { componenteCurricularId: { in: componenteIds } },
        select: {
          _count: { select: { submissoes: true } },
          componenteCurricular: {
            select: {
              turma: {
                select: {
                  _count: {
                    select: { matriculas: { where: { status: 'ATIVA' } } },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

  let totalSubmissoesPossiveis = 0;
  let totalEntregas = 0;
  tarefasComAlunos.forEach((tarefa) => {
    const alunosNaTurma = tarefa.componenteCurricular.turma._count.matriculas;
    totalSubmissoesPossiveis += alunosNaTurma;
    totalEntregas += tarefa._count.submissoes;
  });

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

async function getAtividadesPendentes(user: AuthenticatedRequest['user']) {
  const professorId = user.perfilId;
  if (!professorId) return [];

  const tarefasComSubmissoes = await prisma.tarefas.findMany({
    where: {
      componenteCurricular: { professorId },
      submissoes: { some: {} },
    },
    include: {
      submissoes: {
        select: {
          status: true,
        },
      },
      componenteCurricular: {
        select: {
          materia: { select: { nome: true } },
          turma: { select: { nome: true, serie: true } },
        },
      },
    },
  });

  const atividadesPendentes = tarefasComSubmissoes
    .map((tarefa) => {
      const corrigidas = tarefa.submissoes.filter(
        (s) => s.status === 'AVALIADA',
      ).length;

      const pendentes = tarefa.submissoes.length - corrigidas;

      if (pendentes > 0) {
        return {
          id: tarefa.id,
          materia: tarefa.componenteCurricular.materia.nome
            .substring(0, 3)
            .toUpperCase(),
          titulo: tarefa.titulo,
          turma: `${tarefa.componenteCurricular.turma.serie} ${tarefa.componenteCurricular.turma.nome}`,
          submissoes: pendentes,
          dataEntrega: `Prazo: ${new Date(
            tarefa.data_entrega,
          ).toLocaleDateString('pt-BR')}`,
          tipo: tarefa.tipo,
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort(
      (a, b) =>
        new Date(a.dataEntrega).getTime() - new Date(b.dataEntrega).getTime(),
    );

  return atividadesPendentes.slice(0, 3);
}

async function calcularMediaGeralComponente(
  componenteId: string,
): Promise<number> {
  const [avaliacoes, submissoes] = await Promise.all([
    prisma.avaliacaoParcial.findMany({
      where: { componenteCurricularId: componenteId },
      select: { nota: true },
    }),
    prisma.submissoes.findMany({
      where: {
        tarefa: { componenteCurricularId: componenteId },
        status: 'AVALIADA',
        nota_total: { not: null },
      },
      select: { nota_total: true },
    }),
  ]);

  const todasAsNotas = [
    ...avaliacoes.map((a) => a.nota),
    ...submissoes.map((s) => s.nota_total!),
  ];

  if (todasAsNotas.length === 0) {
    return 0;
  }

  const media =
    todasAsNotas.reduce((acc, nota) => acc + nota, 0) / todasAsNotas.length;
  return media;
}

async function getDesempenhoTurmas(user: AuthenticatedRequest['user']) {
  const professorId = user.perfilId;
  if (!professorId) throw new Error('Usuário não é um professor.');

  const componentes = await prisma.componenteCurricular.findMany({
    where: { professorId },
    select: {
      id: true,
      turma: { select: { id: true, nome: true, serie: true } },
    },
  });

  if (componentes.length === 0) {
    return {
      desempenhoGeral: 0,
      porTurma: [],
      taxaConclusaoGeral: 0,
    };
  }

  const mediasPorComponente = await Promise.all(
    componentes.map(async (c) => ({
      id: c.id,
      turmaId: c.turma.id,
      turmaNome: `${c.turma.serie} ${c.turma.nome}`,
      media: await calcularMediaGeralComponente(c.id),
    })),
  );

  const desempenhoGeral =
    mediasPorComponente.length > 0
      ? mediasPorComponente.reduce((acc, c) => acc + c.media, 0) /
        mediasPorComponente.length
      : 0;

  const porTurma = Array.from(
    mediasPorComponente
      .reduce((map, comp) => {
        const turma = map.get(comp.turmaId) ?? {
          nome: comp.turmaNome,
          medias: [],
        };
        turma.medias.push(comp.media);
        map.set(comp.turmaId, turma);
        return map;
      }, new Map())
      .values(),
  ).map((turma: any) => ({
    nome: turma.nome,
    media:
      turma.medias.length > 0
        ? turma.medias.reduce((a: number, b: number) => a + b, 0) /
          turma.medias.length
        : 0,
  }));

  const tarefasComAlunos = await prisma.tarefas.findMany({
    where: { componenteCurricularId: { in: componentes.map((c) => c.id) } },
    select: {
      _count: { select: { submissoes: true } },
      componenteCurricular: {
        select: {
          turma: {
            select: {
              _count: {
                select: { matriculas: { where: { status: 'ATIVA' } } },
              },
            },
          },
        },
      },
    },
  });

  let totalSubmissoesPossiveis = 0;
  let totalEntregas = 0;
  tarefasComAlunos.forEach((tarefa) => {
    const alunosNaTurma = tarefa.componenteCurricular.turma._count.matriculas;
    totalSubmissoesPossiveis += alunosNaTurma;
    totalEntregas += tarefa._count.submissoes;
  });

  const taxaConclusaoGeral =
    totalSubmissoesPossiveis > 0
      ? Math.round((totalEntregas / totalSubmissoesPossiveis) * 100)
      : 0;

  return { desempenhoGeral, porTurma, taxaConclusaoGeral };
}

async function getCorrecoesDashboard(user: AuthenticatedRequest['user']) {
  const professorId = user.perfilId;
  if (!professorId) throw new Error('Usuário não é um professor.');

  const tarefas = await prisma.tarefas.findMany({
    where: {
      componenteCurricular: { professorId },
      OR: [{ submissoes: { some: {} } }, { tipo: 'TRABALHO' }],
    },
    select: {
      id: true,
      titulo: true,
      data_entrega: true,
      tipo: true,
      componenteCurricular: {
        select: {
          turmaId: true,
          turma: { select: { nome: true, serie: true } },
          materia: { select: { nome: true } },
        },
      },
    },
  });

  if (tarefas.length === 0) {
    return [];
  }

  const tarefaIds = tarefas.map((t) => t.id);
  const turmaIds = [
    ...new Set(tarefas.map((t) => t.componenteCurricular.turmaId)),
  ];

  const submissionStats = await prisma.submissoes.groupBy({
    by: ['tarefaId', 'status'],
    where: {
      tarefaId: { in: tarefaIds },
    },
    _count: {
      id: true,
    },
  });

  const statsMap = new Map<
    string,
    {
      entregas: number;
      corrigidas: number;
    }
  >();
  for (const stat of submissionStats) {
    if (!statsMap.has(stat.tarefaId)) {
      statsMap.set(stat.tarefaId, { entregas: 0, corrigidas: 0 });
    }
    const current = statsMap.get(stat.tarefaId)!;
    current.entregas += stat._count.id;
    if (stat.status === 'AVALIADA') {
      current.corrigidas += stat._count.id;
    }
  }

  const avaliacaoRegistros =
    tarefaIds.length > 0
      ? await prisma.avaliacaoParcial.findMany({
          where: { tarefaId: { in: tarefaIds } },
          select: { tarefaId: true },
        })
      : [];
  const avaliacaoMap = new Map<string, number>();
  for (const registro of avaliacaoRegistros) {
    if (!registro.tarefaId) continue;
    const atual = avaliacaoMap.get(registro.tarefaId) ?? 0;
    avaliacaoMap.set(registro.tarefaId, atual + 1);
  }

  const matriculaRegistros =
    turmaIds.length > 0
      ? await prisma.matriculas.findMany({
          where: { turmaId: { in: turmaIds }, status: 'ATIVA' },
          select: { turmaId: true },
        })
      : [];
  const matriculaMap = new Map<string, number>();
  for (const registro of matriculaRegistros) {
    if (!registro.turmaId) continue;
    const atual = matriculaMap.get(registro.turmaId) ?? 0;
    matriculaMap.set(registro.turmaId, atual + 1);
  }

  const correcoesComStats = tarefas.map((tarefa) => {
    const stats = statsMap.get(tarefa.id) || { entregas: 0, corrigidas: 0 };
    let entregas = stats.entregas;
    let corrigidas = stats.corrigidas;

    if (tarefa.tipo === 'TRABALHO') {
      const totalMatriculas =
        matriculaMap.get(tarefa.componenteCurricular.turmaId) ?? 0;
      const avaliados = avaliacaoMap.get(tarefa.id) ?? 0;
      entregas = Math.max(entregas, totalMatriculas);
      corrigidas = Math.max(corrigidas, avaliados);
    }

    const pendentes = Math.max(entregas - corrigidas, 0);
    return {
      id: tarefa.id,
      titulo: tarefa.titulo,
      turma: `${tarefa.componenteCurricular.turma.serie} ${tarefa.componenteCurricular.turma.nome}`,
      materia: tarefa.componenteCurricular.materia.nome,
      tipo: tarefa.tipo,
      entregas,
      corrigidas,
      pendentes,
      prazo: tarefa.data_entrega,
      status:
        pendentes > 0
          ? ('PENDENTE' as 'PENDENTE' | 'CONCLUIDA')
          : ('CONCLUIDA' as 'PENDENTE' | 'CONCLUIDA'),
    };
  });

  correcoesComStats.sort(
    (a, b) => new Date(b.prazo).getTime() - new Date(a.prazo).getTime(),
  );

  return correcoesComStats;
}

async function getTurmasDashboard(user: AuthenticatedRequest['user']) {
  const professorId = user.perfilId;
  if (!professorId) throw new Error('Usuário não é um professor.');

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
      const [alunosCount, mediaGeral, horarios] = await Promise.all([
        prisma.matriculas.count({
          where: { turmaId: componente.turma.id, status: 'ATIVA' },
        }),
        calcularMediaGeralComponente(componente.id),
        prisma.horarioAula.findMany({
          where: { componenteCurricularId: componente.id },
          select: { dia_semana: true, hora_inicio: true },
          orderBy: { dia_semana: 'asc' },
        }),
      ]);

      const horarioResumo = horarios
        .map((h) => `${h.dia_semana.substring(0, 3)}. ${h.hora_inicio}`)
        .slice(0, 2)
        .join(' | ');

      return {
        componenteId: componente.id,
        turmaId: componente.turma.id,
        nomeTurma: `${componente.turma.serie} ${componente.turma.nome}`,
        materia: componente.materia.nome,
        alunosCount,
        mediaGeral,
        horarioResumo: horarioResumo || 'N/D',
      };
    }),
  );

  return turmasComStats;
}

async function getTurmaDetails(
  componenteId: string,
  user: AuthenticatedRequest['user'],
) {
  const professorId = user.perfilId;
  if (!professorId) throw new Error('Usuário não é um professor.');

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
      where: { turmaId: turmaId, status: 'ATIVA' },
      select: {
        id: true,
        alunoId: true,
      },
    }),
    prisma.tarefas.findMany({
      where: { componenteCurricularId: componenteId },
      include: { _count: { select: { submissoes: true } } },
    }),
  ]);

  const alunoPerfilIds = Array.from(
    new Set(
      matriculas
        .map((matricula) => matricula.alunoId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const alunoPerfis = alunoPerfilIds.length
    ? await prisma.usuarios_aluno.findMany({
        where: { id: { in: alunoPerfilIds } },
        select: { id: true, usuarioId: true },
      })
    : [];

  const usuarioIds = Array.from(
    new Set(
      alunoPerfis
        .map((perfil) => perfil.usuarioId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const usuarios = usuarioIds.length
    ? await prisma.usuarios.findMany({
        where: { id: { in: usuarioIds } },
        select: { id: true, nome: true },
      })
    : [];

  const usuarioMap = new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  const perfilToUsuario = new Map(
    alunoPerfis
      .map((perfil) => {
        const usuario = perfil.usuarioId
          ? usuarioMap.get(perfil.usuarioId)
          : null;
        if (!usuario) {
          return null;
        }
        return [
          perfil.id,
          { usuarioId: usuario.id, nome: usuario.nome },
        ] as const;
      })
      .filter((entry): entry is [string, { usuarioId: string; nome: string }] =>
        Boolean(entry),
      ),
  );

  type MatriculaComUsuario = {
    id: string;
    alunoPerfilId: string;
    usuarioId: string;
    nome: string;
  };

  const matriculasValidas: MatriculaComUsuario[] = matriculas
    .map((matricula) => {
      const usuarioInfo = perfilToUsuario.get(matricula.alunoId);
      if (!usuarioInfo) {
        return null;
      }
      return {
        id: matricula.id,
        alunoPerfilId: matricula.alunoId,
        usuarioId: usuarioInfo.usuarioId,
        nome: usuarioInfo.nome,
      };
    })
    .filter((matricula): matricula is MatriculaComUsuario =>
      Boolean(matricula),
    );
  const totalMatriculas = matriculasValidas.length;

  const matriculaIds = matriculasValidas.map((m) => m.id);

  const PERIODOS_PADRAO = [
    'PRIMEIRO_BIMESTRE',
    'SEGUNDO_BIMESTRE',
    'TERCEIRO_BIMESTRE',
    'QUARTO_BIMESTRE',
  ];

  const avaliacoesPromise = matriculaIds.length
    ? prisma.avaliacaoParcial.findMany({
        where: {
          componenteCurricularId: componente.id,
          matriculaId: { in: matriculaIds },
        },
        select: {
          matriculaId: true,
          nota: true,
          periodo: true,
          tarefaId: true,
        },
      })
    : Promise.resolve([]);

  const totalAulasPromise = prisma.diarioAula.count({
    where: { componenteCurricularId: componente.id },
  });

  const presencasPromise = matriculaIds.length
    ? prisma.diarioAulaPresenca.groupBy({
        by: ['matriculaId'],
        where: {
          matriculaId: { in: matriculaIds },
          situacao: 'PRESENTE',
          diarioAula: { componenteCurricularId: componente.id },
        },
        _count: { _all: true },
      })
    : Promise.resolve([]);

  const [avaliacoesParciais, totalAulas, presencasPorAluno] = await Promise.all(
    [avaliacoesPromise, totalAulasPromise, presencasPromise],
  );

  const avaliacoesPorMatricula = new Map<
    string,
    { nota: number; periodo: string }[]
  >();
  avaliacoesParciais.forEach((avaliacao) => {
    if (avaliacao.tarefaId) return;

    const lista = avaliacoesPorMatricula.get(avaliacao.matriculaId) ?? [];
    lista.push({ nota: avaliacao.nota, periodo: avaliacao.periodo });
    avaliacoesPorMatricula.set(avaliacao.matriculaId, lista);
  });

  const presencasMap = new Map<string, number>();
  if (Array.isArray(presencasPorAluno)) {
    presencasPorAluno.forEach((p) => {
      presencasMap.set(p.matriculaId, p._count._all);
    });
  }

  const alunos = matriculasValidas.map((m) => {
    const notas = avaliacoesPorMatricula.get(m.id) ?? [];

    const notasPorPeriodo: Record<string, number> = {};

    notas.forEach((nota) => {
      if (!notasPorPeriodo[nota.periodo]) {
        notasPorPeriodo[nota.periodo] = 0;
      }
      notasPorPeriodo[nota.periodo] += nota.nota;
    });

    let somaMediasBimestres = 0;
    let bimestresComNota = 0;

    PERIODOS_PADRAO.forEach((periodo) => {
      if (notasPorPeriodo[periodo] !== undefined) {
        somaMediasBimestres += notasPorPeriodo[periodo];
        bimestresComNota++;
      }
    });

    const media =
      bimestresComNota > 0 ? somaMediasBimestres / bimestresComNota : 0;

    const presencas = presencasMap.get(m.id) ?? 0;
    const presenca = totalAulas > 0 ? (presencas / totalAulas) * 100 : 0;

    const status = calcularStatusAluno(media, presenca);

    return {
      id: m.usuarioId,
      nome: m.nome,
      media: parseFloat(media.toFixed(1)),
      presenca: Math.round(presenca),
      status,
    };
  });

  const atividades = tarefas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    tipo: t.tipo,
    data_entrega: t.data_entrega,
    entregas: t._count.submissoes,
    total: totalMatriculas,
  }));

  const mediaGeral = await calcularMediaGeralComponente(componente.id);

  const distribuicao = [
    { range: '9.0 - 10.0', alunos: alunos.filter((a) => a.media >= 9).length },
    {
      range: '7.0 - 8.9',
      alunos: alunos.filter((a) => a.media >= 7 && a.media < 9).length,
    },
    {
      range: '5.0 - 6.9',
      alunos: alunos.filter((a) => a.media >= 5 && a.media < 7).length,
    },
    { range: '0.0 - 4.9', alunos: alunos.filter((a) => a.media < 5).length },
  ].map((d) => ({
    ...d,
    percent:
      totalMatriculas > 0 ? Math.round((d.alunos / totalMatriculas) * 100) : 0,
  }));

  const estatisticas = {
    totalAlunos: totalMatriculas,
    mediaGeral: mediaGeral,
    atividades: tarefas.length,
    distribuicao: distribuicao,
  };

  const horarios = await prisma.horarioAula.findMany({
    where: { componenteCurricularId: componente.id },
    select: { dia_semana: true, hora_inicio: true },
    orderBy: { dia_semana: 'asc' },
  });
  const horarioResumo = horarios
    .map((h) => `${h.dia_semana.substring(0, 3)}. ${h.hora_inicio}`)
    .slice(0, 2)
    .join(' | ');

  return {
    headerInfo: {
      nomeTurma: `${componente.turma.serie} ${componente.turma.nome}`,
      materia: componente.materia.nome,
      horarioResumo: horarioResumo || 'N/D',
      mediaGeral: estatisticas.mediaGeral,
    },
    alunos,
    atividades,
    estatisticas,
  };
}
async function getMyStudents(user: AuthenticatedRequest['user']) {
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
      status: 'ATIVA',
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
    orderBy: { aluno: { usuario: { nome: 'asc' } } },
  });

  const studentMap = new Map();
  matriculas.forEach((m) => {
    if (!studentMap.has(m.aluno.usuario.id)) {
      studentMap.set(m.aluno.usuario.id, m.aluno.usuario);
    }
  });

  return Array.from(studentMap.values());
}

async function getColleagues(user: AuthenticatedRequest['user']) {
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
    distinct: ['usuarioId'],
    orderBy: {
      usuario: {
        nome: 'asc',
      },
    },
  });

  return professores.map((p) => p.usuario);
}

async function getDashboardOverview(user: AuthenticatedRequest['user']) {
  const professorId = user.perfilId;
  if (!professorId) {
    throw new Error('Usuário não é um professor.');
  }

  const [
    professorInfo,
    headerInfo,
    stats,
    horarios,
    atividadesPendentes,
    desempenho,
    conversas,
  ] = await Promise.all([
    getProfessorProfile(user),
    getHeaderInfo(user),
    getHomeStats(user),
    HorarioAulaService.getHorariosByProfessorId(professorId),
    getAtividadesPendentes(user),
    getDesempenhoTurmas(user),
    user.id ? conversaService.findAllForUser(user.id) : Promise.resolve([]),
  ]);

  return {
    professorInfo,
    headerInfo,
    stats,
    horarios,
    atividadesPendentes,
    desempenho,
    conversas,
  };
}

export const professorDashboardService = {
  getHeaderInfo,
  getHomeStats,
  getAtividadesPendentes,
  getDesempenhoTurmas,
  getTurmasDashboard,
  getCorrecoesDashboard,
  getTurmaDetails,
  getMyStudents,
  getColleagues,
  getDashboardOverview,
};
