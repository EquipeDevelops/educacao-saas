import { DiaDaSemana, PrismaClient } from '@prisma/client';
import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import { AuthenticatedRequest } from '../../middlewares/auth';

const prisma = new PrismaClient();

const PERIODOS_PADRAO = [
  'PRIMEIRO_BIMESTRE',
  'SEGUNDO_BIMESTRE',
  'TERCEIRO_BIMESTRE',
  'QUARTO_BIMESTRE',
  'ATIVIDADES_CONTINUAS',
  'RECUPERACAO_FINAL',
] as const;

const PERIODOS_LABEL: Record<(typeof PERIODOS_PADRAO)[number], string> = {
  PRIMEIRO_BIMESTRE: '1º Bimestre',
  SEGUNDO_BIMESTRE: '2º Bimestre',
  TERCEIRO_BIMESTRE: '3º Bimestre',
  QUARTO_BIMESTRE: '4º Bimestre',
  ATIVIDADES_CONTINUAS: 'Atividades Contínuas',
  RECUPERACAO_FINAL: 'Recuperação Final',
};

const PERIODOS_PDF_ORDEM: (typeof PERIODOS_PADRAO)[number][] = [
  'PRIMEIRO_BIMESTRE',
  'SEGUNDO_BIMESTRE',
  'TERCEIRO_BIMESTRE',
  'QUARTO_BIMESTRE',
  'RECUPERACAO_FINAL',
];

const findAllPerfis = (unidadeEscolarId: string) => {
  console.log(
    '[SERVICE] Buscando todos os perfis de alunos para a unidade:',
    unidadeEscolarId,
  );
  return prisma.usuarios_aluno.findMany({
    where: { usuario: { unidadeEscolarId: unidadeEscolarId, status: true } },
    select: {
      id: true,
      numero_matricula: true,
      usuario: { select: { id: true, nome: true } },
    },
    orderBy: { usuario: { nome: 'asc' } },
  });
};

const findOneByUserId = async (usuarioId: string) => {
  return prisma.usuarios_aluno.findFirst({
    where: { usuarioId: usuarioId },
    select: {
      id: true,
      numero_matricula: true,
      usuario: { select: { id: true, nome: true, email: true } },
      matriculas: {
        where: { status: 'ATIVA' },
        select: {
          id: true,
          ano_letivo: true,
          turma: { select: { nome: true, serie: true } },
        },
        take: 1,
      },
    },
  });
};
async function getBoletim(
  usuarioId: string,
  user?: AuthenticatedRequest['user'],
) {
  console.log(`[BOLETIM SERVICE] Iniciando para o usuário ID: ${usuarioId}`);

  const perfilAluno = await prisma.usuarios_aluno.findUnique({
    where: { usuarioId },
    select: {
      id: true,
      numero_matricula: true,
      usuario: {
        select: {
          unidadeEscolarId: true,
          unidade_escolar: { select: { nome: true } },
        },
      },
    },
  });

  if (!perfilAluno) {
    console.error(
      `[BOLETIM SERVICE] ERRO: Perfil de aluno não encontrado para o usuário ID: ${usuarioId}`,
    );
    throw new Error('Perfil de aluno não encontrado para este usuário.');
  }
  const alunoPerfilId = perfilAluno.id;
  console.log(
    `[BOLETIM SERVICE] Perfil de aluno encontrado. ID do Perfil: ${alunoPerfilId}`,
  );

  const materiasEsperadas = new Set<string>();

  const [avaliacoes, submissoes, matriculaAtiva] = await Promise.all([
    prisma.avaliacaoParcial.findMany({
      where: { matricula: { alunoId: alunoPerfilId, status: 'ATIVA' } },
      select: {
        nota: true,
        periodo: true,
        tipo: true,
        tarefaId: true,
        bimestre: { select: { periodo: true } },
        componenteCurricular: {
          select: { materia: { select: { nome: true } } },
        },
      },
    }),
    prisma.submissoes.findMany({
      where: {
        alunoId: alunoPerfilId,
        status: 'AVALIADA',
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
    prisma.matriculas.findFirst({
      where: { alunoId: alunoPerfilId, status: 'ATIVA' },
      select: {
        id: true,
        ano_letivo: true,
        turma: {
          select: {
            id: true,
            componentes_curriculares: {
              select: {
                id: true,
                materia: { select: { nome: true } },
              },
            },
          },
        },
      },
    }),
  ]);
  console.log(
    `[BOLETIM SERVICE] Encontradas ${avaliacoes.length} avaliações parciais e ${submissoes.length} submissões.`,
  );

  // --- LÓGICA DE FREQUÊNCIA ---
  const unidadeEscolarId = perfilAluno.usuario.unidadeEscolarId;
  let dataInicioAno: Date | undefined;
  let dataFimAno: Date | undefined;
  let bimestres: any[] = [];

  if (unidadeEscolarId) {
    bimestres = await prisma.bimestres.findMany({
      where: { unidadeEscolarId },
      orderBy: { dataInicio: 'asc' },
    });

    if (bimestres.length > 0) {
      dataInicioAno = bimestres[0].dataInicio;
      // Encontrar a maior data fim
      const datasFim = bimestres.map((b) => b.dataFim);
      dataFimAno = new Date(Math.max(...datasFim.map((d) => d.getTime())));

      console.log(
        `[BOLETIM SERVICE] Período letivo definido por bimestres: ${dataInicioAno.toISOString()} até ${dataFimAno.toISOString()}`,
      );
    }
  }

  const frequenciaPorMateria: Record<
    string,
    { aulasDadas: number; presencas: number; porcentagem: number }
  > = {};

  const frequenciaPorMateriaBimestre: Record<
    string,
    Record<string, number>
  > = {};

  if (matriculaAtiva && dataInicioAno && dataFimAno) {
    const componentes = matriculaAtiva.turma?.componentes_curriculares || [];

    await Promise.all(
      componentes.map(async (comp) => {
        if (!comp.materia?.nome) return;

        // Frequência Geral
        const totalAulasGeral = await prisma.diarioAula.count({
          where: {
            componenteCurricularId: comp.id,
            data: {
              gte: dataInicioAno,
              lte: dataFimAno,
            },
          },
        });

        const presencasGeral = await prisma.diarioAulaPresenca.count({
          where: {
            matriculaId: matriculaAtiva.id,
            situacao: 'PRESENTE',
            diarioAula: {
              componenteCurricularId: comp.id,
              data: {
                gte: dataInicioAno,
                lte: dataFimAno,
              },
            },
          },
        });

        frequenciaPorMateria[comp.materia.nome] = {
          aulasDadas: totalAulasGeral,
          presencas: presencasGeral,
          porcentagem:
            totalAulasGeral > 0
              ? (presencasGeral / totalAulasGeral) * 100
              : 100,
        };

        // Frequência por Bimestre
        frequenciaPorMateriaBimestre[comp.materia.nome] = {};

        try {
          if (bimestres.length > 0) {
            await Promise.all(
              bimestres.map(async (bimestre) => {
                const totalAulasBimestre = await prisma.diarioAula.count({
                  where: {
                    componenteCurricularId: comp.id,
                    data: {
                      gte: bimestre.dataInicio,
                      lte: bimestre.dataFim,
                    },
                  },
                });

                const presencasBimestre = await prisma.diarioAulaPresenca.count(
                  {
                    where: {
                      matriculaId: matriculaAtiva.id,
                      situacao: 'PRESENTE',
                      diarioAula: {
                        componenteCurricularId: comp.id,
                        data: {
                          gte: bimestre.dataInicio,
                          lte: bimestre.dataFim,
                        },
                      },
                    },
                  },
                );

                if (comp.materia?.nome) {
                  if (totalAulasBimestre > 0) {
                    frequenciaPorMateriaBimestre[comp.materia.nome][
                      bimestre.periodo
                    ] = (presencasBimestre / totalAulasBimestre) * 100;
                  } else {
                    frequenciaPorMateriaBimestre[comp.materia.nome][
                      bimestre.periodo
                    ] = 100;
                  }
                }
              }),
            );
          }
        } catch (err) {
          console.error(
            '[BOLETIM SERVICE] Erro ao calcular frequência por bimestre:',
            err,
          );
        }
      }),
    );
  }
  // -----------------------------

  matriculaAtiva?.turma?.componentes_curriculares?.forEach((componente) => {
    if (componente.materia?.nome) {
      materiasEsperadas.add(componente.materia.nome);
    }
  });

  // --- FILTRO PARA PROFESSOR (REMOVIDO FILTRO, APENAS IDENTIFICAÇÃO) ---
  let materiasDoProfessor: string[] = [];
  if (user?.papel === 'PROFESSOR' && user.perfilId) {
    console.log(
      '[BOLETIM SERVICE] Identificando matérias do professor:',
      user.perfilId,
    );
    const componentesProfessor = await prisma.componenteCurricular.findMany({
      where: {
        professorId: user.perfilId,
        turmaId: matriculaAtiva?.turma?.id,
      },
      select: { materia: { select: { nome: true } } },
    });

    materiasDoProfessor = componentesProfessor.map((c) => c.materia.nome);
  }
  // -----------------------------

  const todasAsNotas: {
    materia: string;
    periodo: string;
    tipo: string;
    nota: number;
  }[] = [];

  avaliacoes.forEach((av) => {
    // Filter out evaluations linked to tasks (keep only manual evaluations)
    if (av.tarefaId) return;

    if (av.componenteCurricular?.materia?.nome) {
      materiasEsperadas.add(av.componenteCurricular.materia.nome);
      todasAsNotas.push({
        materia: av.componenteCurricular.materia.nome,
        periodo: av.bimestre?.periodo || av.periodo,
        tipo: String(av.tipo),
        nota: av.nota,
      });
    } else {
      console.warn(
        '[BOLETIM SERVICE] Aviso: Ignorando avaliação parcial sem matéria associada.',
      );
    }
  });

  // Submissions are task-based, so we ignore them for the bulletin grade
  // submissoes.forEach((sub) => { ... });
  console.log(
    `[BOLETIM SERVICE] Total de notas válidas processadas: ${todasAsNotas.length}`,
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

  materiasEsperadas.forEach((materiaNome) => {
    if (!boletimFinal[materiaNome]) {
      boletimFinal[materiaNome] = {};
    }
    PERIODOS_PADRAO.forEach((periodo) => {
      if (!boletimFinal[materiaNome][periodo]) {
        boletimFinal[materiaNome][periodo] = { avaliacoes: [], media: null };
      }
    });
  });

  for (const materia in boletimFinal) {
    PERIODOS_PADRAO.forEach((periodo) => {
      if (!boletimFinal[materia][periodo]) {
        boletimFinal[materia][periodo] = { avaliacoes: [], media: null };
      }
    });
    let notasDaMateria: number[] = [];
    for (const periodo in boletimFinal[materia]) {
      const notasDoPeriodo = boletimFinal[materia][periodo].avaliacoes.map(
        (av: any) => av.nota,
      );

      // Exclude ATIVIDADES_CONTINUAS from the final average calculation
      if (periodo !== 'ATIVIDADES_CONTINUAS') {
        notasDaMateria.push(...notasDoPeriodo);
      }
      if (notasDoPeriodo.length > 0) {
        const somaPeriodo = notasDoPeriodo.reduce(
          (a: number, b: number) => a + b,
          0,
        );
        boletimFinal[materia][periodo].media = parseFloat(
          somaPeriodo.toFixed(2),
        );
      }
    }
    // Calcular média final como a média das notas dos bimestres (que são somas)
    let somaMediasBimestres = 0;
    let bimestresComNota = 0;

    PERIODOS_PADRAO.forEach((periodo) => {
      // Inject bimester frequency
      if (
        frequenciaPorMateriaBimestre[materia] &&
        frequenciaPorMateriaBimestre[materia][periodo] !== undefined
      ) {
        boletimFinal[materia][periodo].frequencia =
          frequenciaPorMateriaBimestre[materia][periodo];
      } else {
        boletimFinal[materia][periodo].frequencia = 100; // Default
      }

      if (
        periodo !== 'ATIVIDADES_CONTINUAS' &&
        periodo !== 'RECUPERACAO_FINAL'
      ) {
        const mediaPeriodo = boletimFinal[materia][periodo].media;
        if (mediaPeriodo !== null) {
          somaMediasBimestres += mediaPeriodo;
          bimestresComNota++;
        }
      }
    });

    if (bimestresComNota > 0) {
      boletimFinal[materia].mediaFinalGeral = parseFloat(
        (somaMediasBimestres / bimestresComNota).toFixed(2),
      );
    } else {
      boletimFinal[materia].mediaFinalGeral = null;
    }

    // Adicionar frequência geral da matéria
    if (frequenciaPorMateria[materia]) {
      boletimFinal[materia].frequencia = frequenciaPorMateria[materia];
    } else {
      boletimFinal[materia].frequencia = {
        aulasDadas: 0,
        presencas: 0,
        porcentagem: 100,
      };
    }
  }

  // --- NOVOS DADOS ---
  // 1. Comentários
  const comentariosDb = await prisma.comentarioBoletim.findMany({
    where: { matriculaId: matriculaAtiva?.id },
    include: {
      componenteCurricular: { select: { materia: { select: { nome: true } } } },
    },
  });

  const comentarios: Record<string, string> = {};
  comentariosDb.forEach((c) => {
    if (c.componenteCurricular?.materia?.nome) {
      comentarios[c.componenteCurricular.materia.nome] = c.comentario;
    }
  });

  // 2. Média Geral por Bimestre
  const mediaGeralBimestre: Record<string, number | null> = {};
  PERIODOS_PADRAO.forEach((periodo) => {
    if (periodo === 'ATIVIDADES_CONTINUAS') return;

    let somaMedias = 0;
    let countMaterias = 0;

    for (const materia in boletimFinal) {
      const mediaMateria = boletimFinal[materia][periodo]?.media;
      if (typeof mediaMateria === 'number') {
        somaMedias += mediaMateria;
        countMaterias++;
      }
    }

    mediaGeralBimestre[periodo] =
      countMaterias > 0
        ? parseFloat((somaMedias / countMaterias).toFixed(2))
        : null;
  });

  // 3. Frequência Geral
  let somaFrequencias = 0;
  let totalMateriasComFrequencia = 0;

  for (const materia in frequenciaPorMateria) {
    somaFrequencias += frequenciaPorMateria[materia].porcentagem;
    totalMateriasComFrequencia++;
  }

  const frequenciaGeral =
    totalMateriasComFrequencia > 0
      ? somaFrequencias / totalMateriasComFrequencia
      : 100;

  // --- ESTATÍSTICAS DA TURMA ---
  const statsTurma: {
    mediasBimestre: Record<string, number>;
    mediasPorMateria: Record<string, number>;
  } = { mediasBimestre: {}, mediasPorMateria: {} };

  if (matriculaAtiva) {
    // 1. Médias por Bimestre da Turma
    const mediasBimestreDb = await prisma.avaliacaoParcial.groupBy({
      by: ['periodo'],
      where: {
        matricula: {
          turmaId: matriculaAtiva.turma.id,
          status: 'ATIVA',
          ano_letivo: matriculaAtiva.ano_letivo,
        },
      },
      _avg: { nota: true },
    });
    mediasBimestreDb.forEach((m) => {
      if (m._avg.nota) {
        statsTurma.mediasBimestre[m.periodo] = m._avg.nota;
      }
    });

    // 2. Médias por Matéria da Turma
    const mediasMateriaDb = await prisma.avaliacaoParcial.groupBy({
      by: ['componenteCurricularId'],
      where: {
        matricula: {
          turmaId: matriculaAtiva.turma.id,
          status: 'ATIVA',
          ano_letivo: matriculaAtiva.ano_letivo,
        },
      },
      _avg: { nota: true },
    });

    const componentesMap = new Map<string, string>();
    matriculaAtiva.turma.componentes_curriculares.forEach((c) => {
      if (c.materia?.nome) componentesMap.set(c.id, c.materia.nome);
    });

    mediasMateriaDb.forEach((m) => {
      const nome = componentesMap.get(m.componenteCurricularId);
      if (nome && m._avg.nota) {
        statsTurma.mediasPorMateria[nome] = m._avg.nota;
      }
    });
  }

  console.log(
    '[BOLETIM SERVICE] Boletim finalizado e pronto para ser enviado.',
  );

  return {
    boletim: boletimFinal,
    dadosAluno: {
      matricula: perfilAluno.numero_matricula,
      escola:
        perfilAluno.usuario.unidade_escolar?.nome || 'Escola não informada',
      anoLetivo: matriculaAtiva?.ano_letivo,
    },
    mediaGeralBimestre,
    frequenciaGeral,
    comentarios,
    statsTurma,
    materiasDoProfessor,
  };
}

type AgendaEventoTipo =
  | 'Aula'
  | 'Prova'
  | 'Trabalho'
  | 'Tarefa'
  | 'Recuperação'
  | 'Reunião'
  | 'Feriado'
  | 'Evento Escolar';

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
  AULA: 'Aula',
  PROVA: 'Prova',
  TRABALHO: 'Trabalho',
  TAREFA: 'Tarefa',
  RECUPERACAO: 'Recuperação',
  RECUPERACAO_FINAL: 'Recuperação',
  REUNIAO: 'Reunião',
  FERIADO: 'Feriado',
  EVENTO_ESCOLAR: 'Evento Escolar',
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

async function saveComentario(
  usuarioId: string,
  materiaNome: string,
  comentario: string,
  user: AuthenticatedRequest['user'],
) {
  if (user?.papel !== 'PROFESSOR' || !user.perfilId) {
    throw new Error('Apenas professores podem adicionar comentários.');
  }

  const perfilAluno = await prisma.usuarios_aluno.findUnique({
    where: { usuarioId },
    select: { id: true },
  });

  if (!perfilAluno) {
    throw new Error('Aluno não encontrado.');
  }

  const matriculaAtiva = await prisma.matriculas.findFirst({
    where: { alunoId: perfilAluno.id, status: 'ATIVA' },
    select: { id: true, turmaId: true },
  });

  if (!matriculaAtiva) {
    throw new Error('Matrícula ativa não encontrada.');
  }

  const componente = await prisma.componenteCurricular.findFirst({
    where: {
      turmaId: matriculaAtiva.turmaId,
      materia: { nome: materiaNome },
      professorId: user.perfilId, // Ensure the professor teaches this subject
    },
  });

  if (!componente) {
    throw new Error('Você não leciona esta matéria para este aluno.');
  }

  return prisma.comentarioBoletim.upsert({
    where: {
      matriculaId_componenteCurricularId: {
        matriculaId: matriculaAtiva.id,
        componenteCurricularId: componente.id,
      },
    },
    update: { comentario },
    create: {
      matriculaId: matriculaAtiva.id,
      componenteCurricularId: componente.id,
      comentario,
    },
  });
}

async function getAgendaEventos(
  user: AuthenticatedRequest['user'],
  rangeStart: Date,
  rangeEnd: Date,
) {
  if (!user?.perfilId) {
    return [];
  }

  const start = startOfDay(rangeStart);
  const end = endOfDay(rangeEnd);

  const matriculaAtiva = await prisma.matriculas.findFirst({
    where: { alunoId: user.perfilId, status: 'ATIVA' },
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
          type: 'Aula',
          title:
            horario.componenteCurricular?.materia?.nome ||
            horario.turma?.nome ||
            'Aula',
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
      (tarefa.tipo === 'PROVA'
        ? 'Prova'
        : tarefa.tipo === 'TRABALHO'
        ? 'Trabalho'
        : 'Tarefa');

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
        type: tipoMap[String(evento.tipo).toUpperCase()] || 'Evento Escolar',
        title: evento.titulo,
        details:
          [evento.descricao, evento.turma?.nome].filter(Boolean).join(' • ') ||
          undefined,
        time: evento.dia_inteiro
          ? 'Dia inteiro'
          : isPrimeiroDia
          ? formatTime(inicioOriginal)
          : undefined,
      });
    }
  });

  eventos.sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    if (diff !== 0) return diff;

    const horaA = a.time?.slice(0, 5) || '';
    const horaB = b.time?.slice(0, 5) || '';
    return horaA.localeCompare(horaB);
  });

  return eventos.map((evento) => ({
    ...evento,
    date: evento.date.toISOString(),
  }));
}

const formatNotaPdf = (nota?: number | null) =>
  typeof nota === 'number' ? nota.toFixed(1).replace('.', ',') : '--';

async function generateBoletimPdf(usuarioId: string) {
  const [boletimData, perfilAluno] = await Promise.all([
    getBoletim(usuarioId),
    prisma.usuarios_aluno.findFirst({
      where: { usuarioId },
      select: {
        numero_matricula: true,
        usuario: {
          select: {
            nome: true,
            unidade_escolar: { select: { nome: true } },
          },
        },
        matriculas: {
          where: { status: 'ATIVA' },
          select: {
            ano_letivo: true,
            turma: { select: { nome: true, serie: true } },
          },
          take: 1,
        },
      },
    }),
  ]);

  const boletim = boletimData.boletim;

  if (!perfilAluno) {
    throw new Error('Perfil de aluno não encontrado.');
  }

  const doc = await PDFDocument.create();
  const pageSize: [number, number] = [595.28, 841.89];
  let page = doc.addPage(pageSize);
  const pageWidth = page.getSize().width;
  const marginX = 45;
  const marginY = 45;
  const contentWidth = pageWidth - marginX * 2;
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const colors = {
    primary: rgb(15 / 255, 76 / 255, 129 / 255),
    primaryDark: rgb(6 / 255, 45 / 255, 80 / 255),
    text: rgb(33 / 255, 37 / 255, 41 / 255),
    lightText: rgb(94 / 255, 106 / 255, 121 / 255),
    cardBg: rgb(247 / 255, 249 / 255, 252 / 255),
    tableHeaderBg: rgb(226 / 255, 232 / 255, 240 / 255),
    tableStripe: rgb(244 / 255, 248 / 255, 252 / 255),
    tableBorder: rgb(205 / 255, 212 / 255, 222 / 255),
    approved: rgb(16 / 255, 185 / 255, 129 / 255),
    warning: rgb(245 / 255, 158 / 255, 11 / 255),
    danger: rgb(239 / 255, 68 / 255, 68 / 255),
    white: rgb(1, 1, 1),
  };
  const formatDateBr = (date: Date) =>
    `${String(date.getDate()).padStart(2, '0')}/${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}/${date.getFullYear()}`;

  const alunoNome = perfilAluno.usuario?.nome ?? 'Aluno';
  const unidadeNome =
    perfilAluno.usuario?.unidade_escolar?.nome ?? 'Unidade escolar';
  const matriculaInfo = perfilAluno.matriculas[0];
  const turmaInfo = matriculaInfo?.turma
    ? `${matriculaInfo.turma.serie} - ${matriculaInfo.turma.nome}`
    : 'Turma não informada';
  const materias = Object.entries(boletim).sort(([a], [b]) =>
    a.localeCompare(b, 'pt-BR'),
  );
  const mediaGlobal =
    materias.length > 0
      ? materias.reduce(
          (acc, [, materia]) => acc + (materia.mediaFinalGeral || 0),
          0,
        ) / materias.length
      : null;

  const sanitizePdfText = (value?: string | number | null) => {
    if (value === undefined || value === null) {
      return '';
    }
    const normalized = String(value)
      .normalize('NFKC')
      .replace(/\uFFFD/g, '');
    let result = '';
    for (const char of normalized) {
      if (char.charCodeAt(0) <= 0xff) {
        result += char;
        continue;
      }
      const fallback = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (fallback) {
        result += fallback;
      }
    }
    return result;
  };

  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
    color = colors.text,
  ) => {
    page.drawText(sanitizePdfText(text), { x, y, size, font, color });
  };

  const drawRightText = (
    text: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
    color = colors.text,
  ) => {
    const width = font.widthOfTextAtSize(sanitizePdfText(text), size);
    drawText(text, x - width, y, size, font, color);
  };

  const drawCenterText = (
    text: string,
    y: number,
    size: number,
    font: PDFFont,
    color = colors.text,
  ) => {
    const width = font.widthOfTextAtSize(sanitizePdfText(text), size);
    drawText(text, (pageWidth - width) / 2, y, size, font, color);
  };

  let y = page.getHeight() - marginY;

  // Header
  page.drawRectangle({
    x: 0,
    y: y - 80,
    width: pageWidth,
    height: 125,
    color: colors.primary,
  });

  drawCenterText('BOLETIM ESCOLAR', y - 30, 24, boldFont, colors.white);
  drawCenterText(
    unidadeNome.toUpperCase(),
    y - 55,
    14,
    regularFont,
    colors.white,
  );

  y -= 110;

  // Student Info Card
  const cardHeight = 70;
  page.drawRectangle({
    x: marginX,
    y: y - cardHeight,
    width: contentWidth,
    height: cardHeight,
    color: colors.cardBg,
    borderColor: colors.tableBorder,
    borderWidth: 1,
  });

  const col1X = marginX + 15;
  const col2X = marginX + contentWidth / 2 + 10;
  const row1Y = y - 25;
  const row2Y = y - 50;

  drawText('Aluno:', col1X, row1Y, 10, boldFont, colors.lightText);
  drawText(alunoNome, col1X + 35, row1Y, 10, regularFont, colors.text);

  drawText('Matrícula:', col2X, row1Y, 10, boldFont, colors.lightText);
  drawText(
    perfilAluno.numero_matricula,
    col2X + 55,
    row1Y,
    10,
    regularFont,
    colors.text,
  );

  drawText('Turma:', col1X, row2Y, 10, boldFont, colors.lightText);
  drawText(turmaInfo, col1X + 35, row2Y, 10, regularFont, colors.text);

  drawText('Ano Letivo:', col2X, row2Y, 10, boldFont, colors.lightText);
  drawText(
    String(matriculaInfo?.ano_letivo || new Date().getFullYear()),
    col2X + 60,
    row2Y,
    10,
    regularFont,
    colors.text,
  );

  y -= cardHeight + 30;

  // Grades Table
  const colWidths = [140, 55, 55, 55, 55, 65, 50]; // Adjusted for better fit
  const headers = [
    'Disciplina',
    '1º Bim',
    '2º Bim',
    '3º Bim',
    '4º Bim',
    'Rec. Final',
    'Média',
  ];

  // Table Header
  page.drawRectangle({
    x: marginX,
    y: y - 25,
    width: contentWidth,
    height: 25,
    color: colors.tableHeaderBg,
  });

  let currentX = marginX + 10;
  headers.forEach((header, i) => {
    if (i === 0) {
      drawText(header, currentX, y - 18, 9, boldFont, colors.primaryDark);
    } else {
      drawRightText(
        header,
        currentX + colWidths[i] - 10,
        y - 18,
        9,
        boldFont,
        colors.primaryDark,
      );
    }
    currentX += colWidths[i];
  });

  y -= 25;

  // Table Rows
  materias.forEach(([materiaNome, dados], index) => {
    if (y < marginY + 40) {
      page = doc.addPage(pageSize);
      y = page.getHeight() - marginY;
      // Redraw header on new page
      page.drawRectangle({
        x: marginX,
        y: y - 25,
        width: contentWidth,
        height: 25,
        color: colors.tableHeaderBg,
      });
      let hX = marginX + 10;
      headers.forEach((header, i) => {
        if (i === 0) {
          drawText(header, hX, y - 18, 9, boldFont, colors.primaryDark);
        } else {
          drawRightText(
            header,
            hX + colWidths[i] - 10,
            y - 18,
            9,
            boldFont,
            colors.primaryDark,
          );
        }
        hX += colWidths[i];
      });
      y -= 25;
    }

    if (index % 2 === 0) {
      page.drawRectangle({
        x: marginX,
        y: y - 25,
        width: contentWidth,
        height: 25,
        color: colors.tableStripe,
      });
    }

    let rowX = marginX + 10;
    drawText(
      materiaNome.length > 25
        ? materiaNome.substring(0, 25) + '...'
        : materiaNome,
      rowX,
      y - 17,
      9,
      regularFont,
      colors.text,
    );
    rowX += colWidths[0];

    PERIODOS_PDF_ORDEM.forEach((periodo, i) => {
      const nota = dados[periodo]?.media;
      const notaText = formatNotaPdf(nota);
      let color = colors.text;
      if (typeof nota === 'number') {
        color = nota >= 6 ? colors.approved : colors.danger;
      }
      drawRightText(
        notaText,
        rowX + colWidths[i + 1] - 10,
        y - 17,
        9,
        regularFont,
        color,
      );
      rowX += colWidths[i + 1];
    });

    // Final Average
    const mediaFinal = dados.mediaFinalGeral;
    const mediaText = formatNotaPdf(mediaFinal);
    let finalColor = colors.text;
    if (typeof mediaFinal === 'number') {
      finalColor = mediaFinal >= 6 ? colors.approved : colors.danger;
    }
    drawRightText(
      mediaText,
      rowX + colWidths[6] - 10,
      y - 17,
      9,
      boldFont,
      finalColor,
    );

    y -= 25;
  });

  // Footer
  y -= 30;
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 1,
    color: colors.tableBorder,
  });

  y -= 20;
  drawText(
    `Gerado em: ${formatDateBr(new Date())}`,
    marginX,
    y,
    8,
    regularFont,
    colors.lightText,
  );
  if (mediaGlobal !== null) {
    const text = `Média Global do Aluno: ${formatNotaPdf(mediaGlobal)}`;
    drawRightText(
      text,
      pageWidth - marginX,
      y,
      10,
      boldFont,
      colors.primaryDark,
    );
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

export const alunoService = {
  findAllPerfis,
  findOneByUserId,
  getBoletim,
  saveComentario,
  getAgendaEventos,
  generateBoletimPdf,
};
