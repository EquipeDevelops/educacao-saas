import {
  DiaDaSemana,
  PrismaClient,
  StatusSubmissao,
  TipoTarefa,
} from '@prisma/client';
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
            titulo: true,
            tipo: true,
            data_entrega: true,
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
    {
      aulasDadas: number;
      presencas: number;
      faltasJustificadas: number;
      faltasNaoJustificadas: number;
      porcentagem: number;
    }
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
            status: 'CONSOLIDADO',
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
              status: 'CONSOLIDADO',
              data: {
                gte: dataInicioAno,
                lte: dataFimAno,
              },
            },
          },
        });

        const faltasJustificadas = await prisma.diarioAulaPresenca.count({
          where: {
            matriculaId: matriculaAtiva.id,
            situacao: 'FALTA_JUSTIFICADA',
            diarioAula: {
              componenteCurricularId: comp.id,
              status: 'CONSOLIDADO',
              data: {
                gte: dataInicioAno,
                lte: dataFimAno,
              },
            },
          },
        });

        const faltasNaoJustificadas = await prisma.diarioAulaPresenca.count({
          where: {
            matriculaId: matriculaAtiva.id,
            situacao: 'FALTA',
            diarioAula: {
              componenteCurricularId: comp.id,
              status: 'CONSOLIDADO',
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
          faltasJustificadas,
          faltasNaoJustificadas,
          porcentagem:
            totalAulasGeral > 0 ? (presencasGeral / totalAulasGeral) * 100 : 0,
        };
        console.log(
          `[FREQ_DEBUG] Matéria: ${comp.materia.nome}`,
          frequenciaPorMateria[comp.materia.nome],
        );

        // Frequência por Bimestre
        frequenciaPorMateriaBimestre[comp.materia.nome] = {};

        try {
          if (bimestres.length > 0) {
            await Promise.all(
              bimestres.map(async (bimestre) => {
                const totalAulasBimestre = await prisma.diarioAula.count({
                  where: {
                    componenteCurricularId: comp.id,
                    status: 'CONSOLIDADO',
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
                        status: 'CONSOLIDADO',
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
                    ] = 0;
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

  // --- DETALHAMENTO DE ATIVIDADES ---
  const detalhamento: Record<
    string,
    {
      nome: string;
      tipo: string;
      nota: number;
      data?: Date;
    }[]
  > = {};

  // Adicionar avaliações manuais
  avaliacoes.forEach((av) => {
    if (av.tarefaId) return; // Ignorar vinculadas a tarefas
    if (av.componenteCurricular?.materia?.nome) {
      const materia = av.componenteCurricular.materia.nome;
      if (!detalhamento[materia]) detalhamento[materia] = [];
      detalhamento[materia].push({
        nome: `Avaliação (${av.tipo}) - ${
          PERIODOS_LABEL[av.periodo as keyof typeof PERIODOS_LABEL] ||
          av.periodo
        }`,
        tipo: String(av.tipo),
        nota: av.nota,
      });
    }
  });

  // Adicionar submissões (tarefas)
  submissoes.forEach((sub) => {
    if (sub.tarefa?.componenteCurricular?.materia?.nome) {
      const materia = sub.tarefa.componenteCurricular.materia.nome;
      if (!detalhamento[materia]) detalhamento[materia] = [];
      detalhamento[materia].push({
        nome: sub.tarefa.titulo,
        tipo: String(sub.tarefa.tipo),
        nota: sub.nota_total || 0,
        data: sub.tarefa.data_entrega,
      });
    }
  });
  // ----------------------------------

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
        boletimFinal[materia][periodo].frequencia = 0; // Default
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
        faltasJustificadas: 0,
        faltasNaoJustificadas: 0,
        porcentagem: 0,
      };
    }
  }

  // --- NOVOS DADOS ---
  // 1. Comentários
  const comentariosDb = await prisma.comentarioBoletim.findMany({
    where: { matriculaId: matriculaAtiva?.id },
    include: {
      componenteCurricular: {
        select: {
          materia: { select: { nome: true } },
          professor: { select: { usuario: { select: { nome: true } } } },
        },
      },
    },
  });

  const comentarios: Record<
    string,
    { texto: string; autorNome: string; data: Date }
  > = {};
  comentariosDb.forEach((c) => {
    if (c.componenteCurricular?.materia?.nome) {
      comentarios[c.componenteCurricular.materia.nome] = {
        texto: c.comentario,
        autorNome:
          c.componenteCurricular.professor?.usuario?.nome || 'Professor',
        data: c.atualizado_em,
      };
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
    detalhamento,
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
  console.log(
    `[SAVE_COMENTARIO] Iniciando para usuárioId: ${usuarioId}, matéria: ${materiaNome}, professorId: ${user?.perfilId}`,
  );

  if (user?.papel !== 'PROFESSOR' || !user.perfilId) {
    console.error(
      '[SAVE_COMENTARIO] Erro: Usuário não é professor ou sem perfilId.',
    );
    throw new Error('Apenas professores podem adicionar comentários.');
  }

  const perfilAluno = await prisma.usuarios_aluno.findUnique({
    where: { usuarioId },
    select: { id: true },
  });

  if (!perfilAluno) {
    console.error('[SAVE_COMENTARIO] Erro: Perfil de aluno não encontrado.');
    throw new Error('Aluno não encontrado.');
  }
  console.log(`[SAVE_COMENTARIO] Perfil aluno encontrado: ${perfilAluno.id}`);

  const matriculaAtiva = await prisma.matriculas.findFirst({
    where: { alunoId: perfilAluno.id, status: 'ATIVA' },
    select: { id: true, turmaId: true },
  });

  if (!matriculaAtiva) {
    console.error('[SAVE_COMENTARIO] Erro: Matrícula ativa não encontrada.');
    throw new Error('Matrícula ativa não encontrada.');
  }
  console.log(
    `[SAVE_COMENTARIO] Matrícula ativa: ${matriculaAtiva.id}, Turma: ${matriculaAtiva.turmaId}`,
  );

  const componente = await prisma.componenteCurricular.findFirst({
    where: {
      turmaId: matriculaAtiva.turmaId,
      materia: { nome: materiaNome },
      professorId: user.perfilId, // Ensure the professor teaches this subject
    },
  });

  if (!componente) {
    console.error(
      `[SAVE_COMENTARIO] Erro: Componente curricular não encontrado para professor ${user.perfilId} na turma ${matriculaAtiva.turmaId} com matéria ${materiaNome}`,
    );
    throw new Error('Você não leciona esta matéria para este aluno.');
  }
  console.log(
    `[SAVE_COMENTARIO] Componente curricular encontrado: ${componente.id}`,
  );

  const result = await prisma.comentarioBoletim.upsert({
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
  console.log('[SAVE_COMENTARIO] Comentário salvo/atualizado com sucesso.');
  return result;
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
  const pageHeight = page.getSize().height;
  const marginX = 40;
  const marginY = 40;
  const contentWidth = pageWidth - marginX * 2;
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const colors = {
    primary: rgb(0.06, 0.3, 0.51), // #0F4C81
    primaryLight: rgb(0.92, 0.95, 0.98),
    text: rgb(0.13, 0.15, 0.16), // #212529
    textLight: rgb(0.37, 0.42, 0.47), // #5E6A79
    border: rgb(0.8, 0.83, 0.87), // #CDD4DE
    success: rgb(0.06, 0.73, 0.5), // #10B981
    danger: rgb(0.94, 0.27, 0.27), // #EF4444
    white: rgb(1, 1, 1),
    chartBar: rgb(0.06, 0.3, 0.51),
    chartGrid: rgb(0.9, 0.9, 0.9),
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

  let y = pageHeight - marginY;

  // --- HEADER ---
  page.drawRectangle({
    x: 0,
    y: y - 100,
    width: pageWidth,
    height: 140,
    color: colors.primary,
  });

  drawCenterText('BOLETIM ESCOLAR', y - 40, 26, boldFont, colors.white);
  drawCenterText(
    unidadeNome.toUpperCase(),
    y - 70,
    14,
    regularFont,
    colors.white,
  );

  y -= 130;

  // --- STUDENT INFO ---
  const infoBoxHeight = 60;
  page.drawRectangle({
    x: marginX,
    y: y - infoBoxHeight,
    width: contentWidth,
    height: infoBoxHeight,
    color: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
  });

  const col1 = marginX + 15;
  const col2 = marginX + contentWidth / 2 + 10;
  const row1 = y - 25;
  const row2 = y - 45;

  drawText('Aluno:', col1, row1, 10, boldFont, colors.textLight);
  drawText(alunoNome, col1 + 40, row1, 10, regularFont, colors.text);

  drawText('Matrícula:', col2, row1, 10, boldFont, colors.textLight);
  drawText(
    perfilAluno.numero_matricula,
    col2 + 60,
    row1,
    10,
    regularFont,
    colors.text,
  );

  drawText('Turma:', col1, row2, 10, boldFont, colors.textLight);
  drawText(turmaInfo, col1 + 40, row2, 10, regularFont, colors.text);

  drawText('Ano:', col2, row2, 10, boldFont, colors.textLight);
  drawText(
    String(matriculaInfo?.ano_letivo || new Date().getFullYear()),
    col2 + 60,
    row2,
    10,
    regularFont,
    colors.text,
  );

  y -= infoBoxHeight + 30;

  // --- GRADES TABLE ---
  const colWidths = [130, 50, 50, 50, 50, 60, 50, 50];
  const headers = [
    'Disciplina',
    '1º Bim',
    '2º Bim',
    '3º Bim',
    '4º Bim',
    'Rec.',
    'Média',
    'Freq',
  ];

  // Header Background
  page.drawRectangle({
    x: marginX,
    y: y - 25,
    width: contentWidth,
    height: 25,
    color: colors.primaryLight,
  });

  let currentX = marginX + 10;
  headers.forEach((header, i) => {
    if (i === 0) {
      drawText(header, currentX, y - 17, 9, boldFont, colors.primary);
    } else {
      drawRightText(
        header,
        currentX + colWidths[i] - 10,
        y - 17,
        9,
        boldFont,
        colors.primary,
      );
    }
    currentX += colWidths[i];
  });

  y -= 25;

  materias.forEach(([materiaNome, dados], index) => {
    if (y < marginY + 100) {
      // Check for page break
      page = doc.addPage(pageSize);
      y = pageHeight - marginY;

      // Re-draw table header
      page.drawRectangle({
        x: marginX,
        y: y - 25,
        width: contentWidth,
        height: 25,
        color: colors.primaryLight,
      });
      let hX = marginX + 10;
      headers.forEach((header, i) => {
        if (i === 0) {
          drawText(header, hX, y - 17, 9, boldFont, colors.primary);
        } else {
          drawRightText(
            header,
            hX + colWidths[i] - 10,
            y - 17,
            9,
            boldFont,
            colors.primary,
          );
        }
        hX += colWidths[i];
      });
      y -= 25;
    }

    // Row separator
    page.drawLine({
      start: { x: marginX, y },
      end: { x: pageWidth - marginX, y },
      thickness: 0.5,
      color: colors.border,
    });

    let rowX = marginX + 10;
    drawText(
      materiaNome.length > 22
        ? materiaNome.substring(0, 22) + '...'
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
        color = nota >= 6 ? colors.success : colors.danger;
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
      finalColor = mediaFinal >= 6 ? colors.success : colors.danger;
    }
    drawRightText(
      mediaText,
      rowX + colWidths[6] - 10,
      y - 17,
      9,
      boldFont,
      finalColor,
    );
    rowX += colWidths[6];

    // Frequency
    const frequencia = dados.frequencia?.porcentagem ?? 0;
    const freqText = `${frequencia.toFixed(0)}%`;
    let freqColor = frequencia >= 75 ? colors.success : colors.danger;
    drawRightText(
      freqText,
      rowX + colWidths[7] - 10,
      y - 17,
      9,
      regularFont,
      freqColor,
    );

    y -= 25;
  });

  // Bottom border of table
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 1,
    color: colors.border,
  });

  y -= 40;

  // --- PERFORMANCE CHART ---
  if (y < 200) {
    page = doc.addPage(pageSize);
    y = pageHeight - marginY;
  }

  drawText('Análise de Desempenho', marginX, y, 14, boldFont, colors.primary);
  y -= 20;

  const chartHeight = 150;
  const chartWidth = contentWidth;
  const chartY = y - chartHeight;

  // Chart Background
  page.drawRectangle({
    x: marginX,
    y: chartY,
    width: chartWidth,
    height: chartHeight,
    color: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
  });

  // Grid lines (0, 5, 10)
  [0, 5, 10].forEach((val) => {
    const lineY = chartY + (val / 10) * chartHeight;
    page.drawLine({
      start: { x: marginX, y: lineY },
      end: { x: marginX + chartWidth, y: lineY },
      thickness: 0.5,
      color: colors.chartGrid,
      opacity: 0.5,
    });
    drawRightText(
      String(val),
      marginX - 5,
      lineY - 3,
      8,
      regularFont,
      colors.textLight,
    );
  });

  // Bars
  const barWidth = (chartWidth / materias.length) * 0.6;
  const spacing = (chartWidth / materias.length) * 0.4;
  let barX = marginX + spacing / 2;

  materias.forEach(([materiaNome, dados]) => {
    const media = dados.mediaFinalGeral || 0;
    const barHeight = (media / 10) * chartHeight;

    // Bar
    page.drawRectangle({
      x: barX,
      y: chartY,
      width: barWidth,
      height: barHeight,
      color: media >= 6 ? colors.primary : colors.danger,
    });

    // Label (Subject) - Rotated if possible or just short
    const shortName = materiaNome.substring(0, 3).toUpperCase();
    drawCenterText(shortName, chartY - 15, 8, regularFont, colors.textLight); // Can't easily rotate text per bar with this helper, keeping it simple
    // Actually, let's just write the short name centered under the bar
    const textWidth = regularFont.widthOfTextAtSize(shortName, 8);
    page.drawText(shortName, {
      x: barX + (barWidth - textWidth) / 2,
      y: chartY - 12,
      size: 8,
      font: regularFont,
      color: colors.textLight,
    });

    barX += barWidth + spacing;
  });

  y = chartY - 40;

  // --- DETALHAMENTO DE ATIVIDADES ---
  if (
    boletimData.detalhamento &&
    Object.keys(boletimData.detalhamento).length > 0
  ) {
    if (y < 200) {
      page = doc.addPage(pageSize);
      y = pageHeight - marginY;
    }

    drawText(
      'Detalhamento de Atividades',
      marginX,
      y,
      14,
      boldFont,
      colors.primary,
    );
    y -= 25;

    const detalhamento = boletimData.detalhamento;
    const materiasDetalhadas = Object.keys(detalhamento).sort((a, b) =>
      a.localeCompare(b),
    );

    for (const materia of materiasDetalhadas) {
      const atividades = detalhamento[materia];
      if (!atividades || atividades.length === 0) continue;

      if (y < 100) {
        page = doc.addPage(pageSize);
        y = pageHeight - marginY;
      }

      // Subject Header
      page.drawRectangle({
        x: marginX,
        y: y - 20,
        width: contentWidth,
        height: 20,
        color: colors.primaryLight,
      });
      drawText(materia, marginX + 10, y - 14, 10, boldFont, colors.primary);
      y -= 20;

      // Activities List
      // Columns: Data | Atividade | Tipo | Nota
      const detCols = [70, 250, 100, 50];

      // Header for list
      let dX = marginX + 10;
      drawText('Data', dX, y - 15, 8, boldFont, colors.textLight);
      dX += detCols[0];
      drawText('Atividade', dX, y - 15, 8, boldFont, colors.textLight);
      dX += detCols[1];
      drawText('Tipo', dX, y - 15, 8, boldFont, colors.textLight);
      dX += detCols[2];
      drawText('Nota', dX, y - 15, 8, boldFont, colors.textLight);

      y -= 20;

      for (const ativ of atividades) {
        if (y < marginY + 20) {
          page = doc.addPage(pageSize);
          y = pageHeight - marginY;
          // Redraw subject header if split? Maybe just continue
        }

        let rowX = marginX + 10;
        const dataStr = ativ.data ? formatDateBr(new Date(ativ.data)) : '--';
        drawText(dataStr, rowX, y - 10, 8, regularFont, colors.text);
        rowX += detCols[0];

        const nome =
          ativ.nome.length > 50
            ? ativ.nome.substring(0, 50) + '...'
            : ativ.nome;
        drawText(nome, rowX, y - 10, 8, regularFont, colors.text);
        rowX += detCols[1];

        drawText(ativ.tipo, rowX, y - 10, 8, regularFont, colors.text);
        rowX += detCols[2];

        const notaStr = formatNotaPdf(ativ.nota);
        let notaColor = colors.text;
        if (ativ.nota >= 6) notaColor = colors.success;
        else notaColor = colors.danger;

        drawText(notaStr, rowX, y - 10, 8, boldFont, notaColor);

        y -= 15;
      }
      y -= 10; // Spacing between subjects
    }
  }

  // --- FOOTER ---
  const footerY = 30;
  page.drawLine({
    start: { x: marginX, y: footerY + 15 },
    end: { x: pageWidth - marginX, y: footerY + 15 },
    thickness: 1,
    color: colors.border,
  });

  drawText(
    `Gerado em: ${formatDateBr(new Date())}`,
    marginX,
    footerY,
    8,
    regularFont,
    colors.textLight,
  );

  if (mediaGlobal !== null) {
    const text = `Média Global: ${formatNotaPdf(mediaGlobal)}`;
    drawRightText(
      text,
      pageWidth - marginX,
      footerY,
      10,
      boldFont,
      colors.primary,
    );
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

const getProfile = async (user: AuthenticatedRequest['user']) => {
  if (!user.id) {
    throw new Error('Usuário não identificado.');
  }

  const alunoPerfil = await prisma.usuarios_aluno.findUnique({
    where: { usuarioId: user.id },
    include: {
      usuario: {
        select: {
          nome: true,
          email: true,
          data_nascimento: true,
          status: true,
        },
      },
      matriculas: {
        where: { status: 'ATIVA' },
        include: {
          turma: {
            include: {
              unidade_escolar: { select: { nome: true } },
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!alunoPerfil) {
    throw new Error('Perfil de aluno não encontrado.');
  }

  const matriculaAtiva = alunoPerfil.matriculas[0];

  // Calcular estatísticas
  let totalAtividadesEntregues = 0;
  let provasFeitas = 0;
  let mediaGlobal = 0;

  if (matriculaAtiva) {
    const submissoes = await prisma.submissoes.findMany({
      where: {
        alunoId: alunoPerfil.id,
        status: { in: [StatusSubmissao.ENVIADA, StatusSubmissao.AVALIADA] },
        tarefa: {
          componenteCurricular: { turmaId: matriculaAtiva.turmaId },
        },
      },
      include: {
        tarefa: { select: { tipo: true } },
      },
    });

    totalAtividadesEntregues = submissoes.length;
    provasFeitas = submissoes.filter(
      (s) => s.tarefa.tipo === TipoTarefa.PROVA,
    ).length;

    const notas = await prisma.submissoes.findMany({
      where: {
        alunoId: alunoPerfil.id,
        status: StatusSubmissao.AVALIADA,
        nota_total: { not: null },
        tarefa: {
          componenteCurricular: { turmaId: matriculaAtiva.turmaId },
        },
      },
      select: { nota_total: true },
    });

    if (notas.length > 0) {
      const somaNotas = notas.reduce(
        (acc, curr) => acc + (curr.nota_total || 0),
        0,
      );
      mediaGlobal = parseFloat((somaNotas / notas.length).toFixed(1));
    }
  }

  return {
    nome: alunoPerfil.usuario.nome,
    email: alunoPerfil.usuario.email,
    status: alunoPerfil.usuario.status,
    dataNascimento: alunoPerfil.usuario.data_nascimento?.toISOString() || '',
    escola: matriculaAtiva?.turma.unidade_escolar.nome || 'Não matriculado',
    numeroMatricula: alunoPerfil.numero_matricula,
    emailResponsavel: alunoPerfil.email_responsavel || '',
    turma: matriculaAtiva
      ? `${matriculaAtiva.turma.serie} - ${matriculaAtiva.turma.nome}`
      : 'Não matriculado',
    anoLetivo: matriculaAtiva?.ano_letivo || new Date().getFullYear(),
    totalAtividadesEntregues,
    provasFeitas,
    mediaGlobal,
  };
};

export const alunoService = {
  findAllPerfis,
  findOne: findOneByUserId,
  findOneByUserId,
  getBoletim,
  saveComentario,
  getAgendaEventos,
  generateBoletimPdf,
  getProfile,
};
