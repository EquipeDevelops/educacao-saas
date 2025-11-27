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
  PRIMEIRO_BIMESTRE: '1Âº Bimestre',
  SEGUNDO_BIMESTRE: '2Âº Bimestre',
  TERCEIRO_BIMESTRE: '3Âº Bimestre',
  QUARTO_BIMESTRE: '4Âº Bimestre',
  ATIVIDADES_CONTINUAS: 'Atividades ContÃ­nuas',
  RECUPERACAO_FINAL: 'RecuperaÃ§Ã£o Final',
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
      usuario: { select: { id: true, nome: true, email: true } },
      matriculas: {
        where: { status: 'ATIVA' },
        select: { id: true },
        take: 1,
      },
    },
  });
};
async function getBoletim(usuarioId: string) {
  console.log(
    `\n--- [BOLETIM SERVICE] Iniciando para o usuÃ¡rio ID: ${usuarioId} ---`,
  );

  const perfilAluno = await prisma.usuarios_aluno.findUnique({
    where: { usuarioId },
    select: { id: true },
  });

  if (!perfilAluno) {
    console.error(
      `[BOLETIM SERVICE] ERRO: Perfil de aluno nÃ£o encontrado para o usuÃ¡rio ID: ${usuarioId}`,
    );
    throw new Error('Perfil de aluno nÃ£o encontrado para este usuÃ¡rio.');
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
        turma: {
          select: {
            componentes_curriculares: {
              select: {
                materia: { select: { nome: true } },
              },
            },
          },
        },
      },
    }),
  ]);
  console.log(
    `[BOLETIM SERVICE] Encontradas ${avaliacoes.length} avaliaÃ§Ãµes parciais e ${submissoes.length} submissÃµes.`,
  );

  matriculaAtiva?.turma?.componentes_curriculares?.forEach((componente) => {
    if (componente.materia?.nome) {
      materiasEsperadas.add(componente.materia.nome);
    }
  });

  const todasAsNotas: {
    materia: string;
    periodo: string;
    tipo: string;
    nota: number;
  }[] = [];

  avaliacoes.forEach((av) => {
    if (av.componenteCurricular?.materia?.nome) {
      materiasEsperadas.add(av.componenteCurricular.materia.nome);
      todasAsNotas.push({
        materia: av.componenteCurricular.materia.nome,
        periodo: av.periodo,
        tipo: String(av.tipo),
        nota: av.nota,
      });
    } else {
      console.warn(
        '[BOLETIM SERVICE] Aviso: Ignorando avaliaÃ§Ã£o parcial sem matÃ©ria associada.',
      );
    }
  });

  submissoes.forEach((sub) => {
    if (sub.tarefa?.componenteCurricular?.materia?.nome) {
      materiasEsperadas.add(sub.tarefa.componenteCurricular.materia.nome);
      todasAsNotas.push({
        materia: sub.tarefa.componenteCurricular.materia.nome,
        periodo: 'ATIVIDADES_CONTINUAS',
        tipo: String(sub.tarefa.tipo),
        nota: sub.nota_total!,
      });
    } else {
      console.warn(
        '[BOLETIM SERVICE] Aviso: Ignorando submissÃ£o sem matÃ©ria associada.',
      );
    }
  });
  console.log(
    `[BOLETIM SERVICE] Total de notas vÃ¡lidas processadas: ${todasAsNotas.length}`,
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
        const mediaPeriodo =
          notasDoPeriodo.reduce((a: number, b: number) => a + b, 0) /
          notasDoPeriodo.length;
        boletimFinal[materia][periodo].media = parseFloat(
          mediaPeriodo.toFixed(2),
        );
      }
    }
    if (notasDaMateria.length > 0) {
      const mediaFinalMateria =
        notasDaMateria.reduce((a, b) => a + b, 0) / notasDaMateria.length;
      boletimFinal[materia].mediaFinalGeral = parseFloat(
        mediaFinalMateria.toFixed(2),
      );
    } else {
      boletimFinal[materia].mediaFinalGeral = null;
    }
  }

  console.log(
    '[BOLETIM SERVICE] Boletim finalizado e pronto para ser enviado.',
  );
  return boletimFinal;
}

type AgendaEventoTipo =
  | 'Aula'
  | 'Prova'
  | 'Trabalho'
  | 'Tarefa'
  | 'RecuperaÃ§Ã£o'
  | 'ReuniÃ£o'
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
  RECUPERACAO: 'RecuperaÃ§Ã£o',
  RECUPERACAO_FINAL: 'RecuperaÃ§Ã£o',
  REUNIAO: 'ReuniÃ£o',
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
          [evento.descricao, evento.turma?.nome]
            .filter(Boolean)
            .join(' â€¢ ') || undefined,
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
  const [boletim, perfilAluno] = await Promise.all([
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

  if (!perfilAluno) {
    throw new Error('Perfil de aluno nǜo encontrado.');
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
    : 'Turma nǜo informada';
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
        for (const fbChar of fallback) {
          if (fbChar.charCodeAt(0) <= 0xff) {
            result += fbChar;
          }
        }
      }
    }
    return result;
  };

  let cursorY = page.getSize().height - marginY;

  const addPage = () => {
    page = doc.addPage(pageSize);
    cursorY = page.getSize().height - marginY;
  };

  const ensureSpace = (needed = 24) => {
    if (cursorY - needed <= marginY) {
      addPage();
    }
  };

  const writeLine = (
    text: string,
    {
      size = 11,
      font = regularFont,
      color = colors.text,
      indent = 0,
      spacing = 6,
    }: {
      size?: number;
      font?: PDFFont;
      color?: ReturnType<typeof rgb>;
      indent?: number;
      spacing?: number;
    } = {},
  ) => {
    const totalHeight = size + spacing;
    ensureSpace(totalHeight);
    page.drawText(sanitizePdfText(text), {
      x: marginX + indent,
      y: cursorY - size,
      size,
      font,
      color,
    });
    cursorY -= totalHeight;
  };

  const drawHeader = () => {
    const headerHeight = 70;
    ensureSpace(headerHeight + 16);
    const headerBottomY = cursorY - headerHeight;

    page.drawRectangle({
      x: marginX,
      y: headerBottomY,
      width: contentWidth,
      height: headerHeight,
      color: colors.primary,
    });

    page.drawText(sanitizePdfText('Boletim Escolar'), {
      x: marginX + 18,
      y: headerBottomY + headerHeight - 28,
      size: 20,
      font: boldFont,
      color: colors.white,
    });

    page.drawText(sanitizePdfText(unidadeNome), {
      x: marginX + 18,
      y: headerBottomY + headerHeight - 48,
      size: 12,
      font: regularFont,
      color: colors.white,
    });

    const anoText = `Ano letivo: ${matriculaInfo?.ano_letivo ?? '--'}`;
    page.drawText(sanitizePdfText(anoText), {
      x: marginX + 18,
      y: headerBottomY + 16,
      size: 11,
      font: regularFont,
      color: colors.white,
    });

    cursorY = headerBottomY - 24;
  };

  const drawInfoCard = () => {
    const infoItems = [
      { label: 'Aluno', value: alunoNome },
      { label: 'Matr��cula', value: perfilAluno.numero_matricula ?? '--' },
      { label: 'Turma', value: turmaInfo },
      { label: 'Unidade', value: unidadeNome },
    ];

    const columns = 2;
    const cardPadding = 16;
    const rowHeight = 28;
    const rows = Math.ceil(infoItems.length / columns);
    const cardHeight = rows * rowHeight + cardPadding * 2;

    ensureSpace(cardHeight + 16);
    const cardBottomY = cursorY - cardHeight;

    page.drawRectangle({
      x: marginX,
      y: cardBottomY,
      width: contentWidth,
      height: cardHeight,
      color: colors.cardBg,
      borderColor: colors.tableBorder,
      borderWidth: 0.5,
    });

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        const item = infoItems[index];
        if (!item) continue;

        const cellWidth = contentWidth / columns;
        const cellX = marginX + col * cellWidth;
        const baseY = cursorY - cardPadding - row * rowHeight - 14;

        page.drawText(sanitizePdfText(item.label), {
          x: cellX + 10,
          y: baseY,
          size: 10,
          font: boldFont,
          color: colors.lightText,
        });

        page.drawText(sanitizePdfText(item.value), {
          x: cellX + 10,
          y: baseY - 12,
          size: 12,
          font: regularFont,
          color: colors.text,
        });
      }
    }

    cursorY = cardBottomY - 24;
  };

  const drawSummaryChips = () => {
    const summaryItems = [
      { label: 'Total de disciplinas', value: String(materias.length) },
      {
        label: 'M��dia global',
        value: mediaGlobal != null ? formatNotaPdf(mediaGlobal) : '--',
      },
      { label: 'Gerado em', value: formatDateBr(new Date()) },
    ];

    const chipGap = 12;
    const chipHeight = 44;
    const chipWidth =
      (contentWidth - chipGap * (summaryItems.length - 1)) /
      summaryItems.length;

    ensureSpace(chipHeight + 12);

    summaryItems.forEach((item, index) => {
      const x = marginX + index * (chipWidth + chipGap);
      const y = cursorY - chipHeight;

      page.drawRectangle({
        x,
        y,
        width: chipWidth,
        height: chipHeight,
        color: colors.tableStripe,
        borderColor: colors.tableBorder,
        borderWidth: 0.5,
      });

      page.drawText(sanitizePdfText(item.label), {
        x: x + 10,
        y: y + chipHeight - 18,
        size: 9,
        font: boldFont,
        color: colors.lightText,
      });

      page.drawText(sanitizePdfText(item.value), {
        x: x + 10,
        y: y + 14,
        size: 14,
        font: boldFont,
        color: colors.primaryDark,
      });
    });

    cursorY -= chipHeight + 24;
  };

  type TableColumn = {
    key: string;
    label: string;
    width: number;
    align: 'left' | 'center';
  };

  const tableColumns: TableColumn[] = [
    { key: 'disciplina', label: 'Disciplina', width: 130, align: 'left' },
    ...PERIODOS_PDF_ORDEM.map((periodo) => ({
      key: periodo,
      label: PERIODOS_LABEL[periodo],
      width: periodo === 'RECUPERACAO_FINAL' ? 58 : 52,
      align: 'center' as const,
    })),
    { key: 'mediaFinal', label: 'M��dia final', width: 60, align: 'center' },
    { key: 'status', label: 'Situa��ǜo', width: 70, align: 'center' },
  ];

  const totalTableWidth = tableColumns.reduce(
    (acc, column) => acc + column.width,
    0,
  );

  if (totalTableWidth > contentWidth) {
    const scale = contentWidth / totalTableWidth;
    tableColumns.forEach((column) => {
      column.width = parseFloat((column.width * scale).toFixed(2));
    });

    const adjustedWidth = tableColumns.reduce(
      (acc, column) => acc + column.width,
      0,
    );
    const diff = contentWidth - adjustedWidth;
    tableColumns[tableColumns.length - 1].width += diff;
  }

  const truncateToWidth = (
    rawText: string,
    width: number,
    font: PDFFont,
    size: number,
  ) => {
    const text = sanitizePdfText(rawText);
    if (font.widthOfTextAtSize(text, size) <= width - 8) {
      return text;
    }
    let truncated = text;
    while (truncated.length > 1) {
      truncated = truncated.slice(0, -1);
      const withDots = `${truncated}...`;
      if (font.widthOfTextAtSize(withDots, size) <= width - 8) {
        return withDots;
      }
    }
    return truncated;
  };

  const drawTableRow = (
    data: Record<string, string>,
    {
      header = false,
      stripe = false,
      cellColors = {},
    }: {
      header?: boolean;
      stripe?: boolean;
      cellColors?: Record<string, ReturnType<typeof rgb>>;
    } = {},
  ) => {
    const rowHeight = header ? 30 : 24;
    ensureSpace(rowHeight + 4);
    const rowBottomY = cursorY - rowHeight;
    let cellX = marginX;

    tableColumns.forEach((column) => {
      const backgroundColor = header
        ? colors.tableHeaderBg
        : stripe
        ? colors.tableStripe
        : undefined;

      page.drawRectangle({
        x: cellX,
        y: rowBottomY,
        width: column.width,
        height: rowHeight,
        color: backgroundColor,
        borderColor: colors.tableBorder,
        borderWidth: 0.5,
      });

      const font = header ? boldFont : regularFont;
      const fontSize = 10;
      const cellText = header ? column.label : data[column.key] ?? '';
      const processedText =
        !header && column.align === 'left'
          ? truncateToWidth(cellText, column.width, font, fontSize)
          : sanitizePdfText(cellText);

      const textWidth = font.widthOfTextAtSize(processedText, fontSize);
      let textX =
        column.align === 'center'
          ? cellX + column.width / 2 - textWidth / 2
          : cellX + 6;
      if (column.align === 'center' && textWidth > column.width - 6) {
        textX = cellX + 3;
      }

      const textColor =
        cellColors[column.key] || (header ? colors.primaryDark : colors.text);

      const textY = rowBottomY + (rowHeight - fontSize) / 2 + 1;
      page.drawText(processedText, {
        x: textX,
        y: textY,
        size: fontSize,
        font,
        color: textColor,
      });

      cellX += column.width;
    });

    cursorY -= rowHeight;
  };

  const getStatusData = (media?: number | null) => {
    if (typeof media !== 'number') {
      return { label: 'Em andamento', color: colors.warning };
    }
    if (media >= 7) {
      return { label: 'Aprovado', color: colors.approved };
    }
    if (media < 5) {
      return { label: 'Reprovado', color: colors.danger };
    }
    return { label: 'Recupera��ǜo', color: colors.warning };
  };

  drawHeader();
  drawInfoCard();
  drawSummaryChips();

  if (materias.length === 0) {
    writeLine(
      'Ainda nǜo hǭ notas registradas para este aluno neste ano letivo.',
      { size: 12 },
    );
  } else {
    drawTableRow({}, { header: true });

    materias.forEach(([materiaNome, materiaData], index) => {
      const statusInfo = getStatusData(materiaData.mediaFinalGeral);
      const rowValues: Record<string, string> = {
        disciplina: materiaNome,
        mediaFinal: formatNotaPdf(materiaData.mediaFinalGeral),
        status: statusInfo.label,
      };

      PERIODOS_PDF_ORDEM.forEach((periodo) => {
        rowValues[periodo] = formatNotaPdf(materiaData[periodo]?.media);
      });

      drawTableRow(rowValues, {
        stripe: index % 2 === 1,
        cellColors: { status: statusInfo.color },
      });
    });
  }

  writeLine('', { spacing: 2 });
  writeLine(`Documento gerado em ${formatDateBr(new Date())}`, {
    size: 10,
    color: colors.lightText,
  });

  const pdfBytes = await doc.save();
  return pdfBytes;
}

async function getProfile(user: AuthenticatedRequest['user']) {
  if (
    !user ||
    user.papel !== 'ALUNO' ||
    !user.perfilId ||
    !user.unidadeEscolarId
  ) {
    throw new Error('UsuÃ¡rio nÃ£o Ã© um aluno vÃ¡lido.');
  }

  const { id: usuarioId, perfilId: alunoPerfilId, unidadeEscolarId } = user;
  const [usuario, perfilAluno, matriculaAtiva] = await Promise.all([
    prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: {
        nome: true,
        email: true,
        data_nascimento: true,
        status: true,
        unidade_escolar: { select: { nome: true } },
      },
    }),
    prisma.usuarios_aluno.findUnique({
      where: { id: alunoPerfilId },
      select: { numero_matricula: true, email_responsavel: true },
    }),
    prisma.matriculas.findFirst({
      where: { alunoId: alunoPerfilId, status: 'ATIVA' },
      select: {
        ano_letivo: true,
        turma: { select: { nome: true, serie: true } },
      },
    }),
  ]);

  if (!usuario || !perfilAluno || !matriculaAtiva) {
    throw new Error('Dados essenciais do aluno nÃ£o encontrados.');
  }

  const [totalEntregas, provasFeitas] = await Promise.all([
    prisma.submissoes.count({
      where: {
        alunoId: alunoPerfilId,
        status: { in: ['ENVIADA', 'ENVIADA_COM_ATRASO', 'AVALIADA'] },
      },
    }),
    prisma.submissoes.count({
      where: {
        alunoId: alunoPerfilId,
        tarefa: { tipo: 'PROVA' },
        status: { in: ['ENVIADA', 'ENVIADA_COM_ATRASO', 'AVALIADA'] },
      },
    }),
  ]);

  const boletimData = await getBoletim(usuarioId);
  const materias = Object.values(boletimData);
  let mediaGlobal = 0;
  if (materias.length > 0) {
    const somaMedias = materias.reduce(
      (acc, materia) => acc + (materia.mediaFinalGeral || 0),
      0,
    );
    mediaGlobal = somaMedias / materias.length;
  }

  return {
    nome: usuario.nome,
    email: usuario.email,
    status: usuario.status,
    dataNascimento: usuario.data_nascimento,
    escola: usuario.unidade_escolar?.nome,
    numeroMatricula: perfilAluno.numero_matricula,
    emailResponsavel: perfilAluno.email_responsavel,
    turma: `${matriculaAtiva.turma.serie} - ${matriculaAtiva.turma.nome}`,
    anoLetivo: matriculaAtiva.ano_letivo,
    totalAtividadesEntregues: totalEntregas,
    provasFeitas: provasFeitas,
    mediaGlobal: parseFloat(mediaGlobal.toFixed(2)),
  };
}

export const alunoService = {
  findAllPerfis,
  findOne: findOneByUserId,
  getBoletim,
  getAgendaEventos,
  generateBoletimPdf,
  getProfile,
};
