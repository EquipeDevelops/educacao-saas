import {
  PrismaClient,
  SituacaoPresenca,
  StatusMatricula,
} from "@prisma/client";
import { AuthenticatedRequest } from "@/middlewares/auth";
import { obterObjetivosBnccPorDisciplina } from "./bncc.service";

const prisma = new PrismaClient();

type UsuarioAutenticado = AuthenticatedRequest["user"];

type DiarioObjetivoInput = {
  codigo: string;
  descricao: string;
  etapa?: string | null;
  area?: string | null;
};

type CreateDiarioInput = {
  data: string;
  componenteCurricularId: string;
  objetivos: DiarioObjetivoInput[];
  tema: string;
  atividade: string;
  observacoes?: string;
};

type PresencaInput = {
  matriculaId: string;
  situacao: SituacaoPresenca;
  observacao?: string;
};

type FrequenciaResumoAluno = {
  matriculaId: string;
  aluno: string;
  statusMatricula: StatusMatricula;
  totalAulasRegistradas: number;
  totalRegistradoParaAluno: number;
  presentes: number;
  faltas: number;
  faltasJustificadas: number;
  percentualPresenca: number;
  presencas: {
    diarioId: string;
    data: string;
    situacao: SituacaoPresenca;
    objetivoCodigo: string;
    objetivos: DiarioObjetivoInput[];
  }[];
};

type FrequenciaDetalhadaResposta = {
  componente: {
    id: string;
    turmaId: string;
    nomeTurma: string;
    materia: string;
  };
  totalAulas: number;
  aulas: {
    id: string;
    data: string;
    objetivoCodigo: string;
    objetivoDescricao: string;
    objetivos: DiarioObjetivoInput[];
    tema: string;
    atividade: string;
    presencas: {
      matriculaId: string;
      aluno: string;
      situacao: SituacaoPresenca;
      statusMatricula: StatusMatricula;
      observacao: string | null;
    }[];
    resumoPresencas: {
      presentes: number;
      faltas: number;
      faltasJustificadas: number;
    };
  }[];
  alunos: FrequenciaResumoAluno[];
};

function ensureProfessor(user: UsuarioAutenticado) {
  if (!user?.perfilId || user.papel !== "PROFESSOR") {
    throw new Error("Apenas professores podem acessar o diário de aula.");
  }
}

function mapearObjetivosRegistro(
  registro:
    | {
        objetivoCodigo: string | null;
        objetivoDescricao: string | null;
        objetivos?: { codigo: string; descricao: string; etapa?: string | null; area?: string | null }[];
      }
    | null
    | undefined
): DiarioObjetivoInput[] {
  if (!registro) return [];

  const mapa = new Map<string, DiarioObjetivoInput>();

  if (registro.objetivoCodigo && registro.objetivoDescricao) {
    mapa.set(registro.objetivoCodigo, {
      codigo: registro.objetivoCodigo,
      descricao: registro.objetivoDescricao,
    });
  }

  registro.objetivos?.forEach((objetivo) => {
    if (!objetivo.codigo || !objetivo.descricao) return;
    const codigo = objetivo.codigo.trim();
    if (!codigo) return;
    if (!mapa.has(codigo)) {
      mapa.set(codigo, {
        codigo,
        descricao: objetivo.descricao,
        etapa: objetivo.etapa ?? null,
        area: objetivo.area ?? null,
      });
    }
  });

  return Array.from(mapa.values());
}

async function obterComponenteDoProfessor(
  componenteId: string,
  user: UsuarioAutenticado
) {
  ensureProfessor(user);
  const componente = await prisma.componenteCurricular.findFirst({
    where: { id: componenteId, professorId: user.perfilId! },
    include: {
      materia: { select: { id: true, nome: true } },
      turma: {
        select: {
          id: true,
          nome: true,
          serie: true,
          turno: true,
          unidadeEscolarId: true,
        },
      },
    },
  });

  if (!componente) {
    throw new Error("Componente curricular não encontrado para o professor.");
  }

  return componente;
}

export async function listarTurmas(user: UsuarioAutenticado) {
  ensureProfessor(user);

  const componentes = await prisma.componenteCurricular.findMany({
    where: {
      professorId: user.perfilId!,
      turma: {
        isNot: null,
      },
    },
    select: {
      id: true,
      ano_letivo: true,
      materia: { select: { nome: true } },
      turma: {
        select: {
          id: true,
          nome: true,
          serie: true,
          turno: true,
          unidadeEscolarId: true,
        },
      },
    },
  });

  const componentesComTurma = componentes.filter(
    (componente) => {
      if (!componente.turma || !componente.materia) {
        return false;
      }

      if (user.unidadeEscolarId) {
        return (
          componente.turma.unidadeEscolarId === user.unidadeEscolarId
        );
      }

      return true;
    },
  );

  if (!componentesComTurma.length) {
    return [];
  }

  const turmaIds = componentesComTurma.map((c) => c.turma!.id);
  const matriculas = await prisma.matriculas.findMany({
    where: { turmaId: { in: turmaIds } },
    select: { turmaId: true, status: true },
  });

  const diarios = await prisma.diarioAula.findMany({
    where: { componenteCurricularId: { in: componentesComTurma.map((c) => c.id) } },
    select: { id: true, data: true, componenteCurricularId: true },
    orderBy: { data: "desc" },
  });

  const statsMap = new Map<
    string,
    { total: number; ativos: number; inativos: number }
  >();
  matriculas.forEach((matricula) => {
    const current = statsMap.get(matricula.turmaId) ?? {
      total: 0,
      ativos: 0,
      inativos: 0,
    };
    current.total += 1;
    if (matricula.status === StatusMatricula.ATIVA) {
      current.ativos += 1;
    } else {
      current.inativos += 1;
    }
    statsMap.set(matricula.turmaId, current);
  });

  const ultimoRegistroPorComponente = new Map<string, Date>();
  diarios.forEach((registro) => {
    if (!ultimoRegistroPorComponente.has(registro.componenteCurricularId)) {
      ultimoRegistroPorComponente.set(
        registro.componenteCurricularId,
        registro.data
      );
    }
  });

  return componentesComTurma
    .map((componente) => {
      const turma = componente.turma!;
      const serie = turma.serie ? String(turma.serie).trim() : "";
      const nome = turma.nome ? String(turma.nome).trim() : "";
      const nomeTurma = [serie, nome].filter(Boolean).join(" ");
      const resumoTurma = statsMap.get(turma.id) ?? {
        total: 0,
        ativos: 0,
        inativos: 0,
      };
      return {
        componenteId: componente.id,
        turmaId: turma.id,
        nomeTurma: nomeTurma || turma.id,
        materia: componente.materia!.nome,
        turno: turma.turno,
        alunosTotal: resumoTurma.total,
        alunosAtivos: resumoTurma.ativos,
        alunosInativos: resumoTurma.inativos,
        ultimoRegistro:
          ultimoRegistroPorComponente.get(componente.id)?.toISOString() || null,
      };
    })
    .sort((a, b) => a.nomeTurma.localeCompare(b.nomeTurma));
}

export async function listarAlunos(
  componenteId: string,
  user: UsuarioAutenticado
) {
  const componente = await obterComponenteDoProfessor(componenteId, user);

  const matriculas = await prisma.matriculas.findMany({
    where: { turmaId: componente.turma.id },
    select: {
      id: true,
      status: true,
      aluno: { select: { usuario: { select: { nome: true, id: true } } } },
    },
    orderBy: { aluno: { usuario: { nome: "asc" } } },
  });

  const matriculaIds = matriculas.map((m) => m.id);

  const presencas = await prisma.diarioAulaPresenca.findMany({
    where: { matriculaId: { in: matriculaIds } },
    include: { diarioAula: { select: { data: true } } },
  });

  const presencaMaisRecente = new Map<
    string,
    { data: Date; situacao: SituacaoPresenca }
  >();

  presencas.forEach((registro) => {
    const atual = presencaMaisRecente.get(registro.matriculaId);
    if (!atual || atual.data < registro.diarioAula.data) {
      presencaMaisRecente.set(registro.matriculaId, {
        data: registro.diarioAula.data,
        situacao: registro.situacao,
      });
    }
  });

  return {
    turma: {
      id: componente.turma.id,
      nome: `${componente.turma.serie} ${componente.turma.nome}`,
      materia: componente.materia.nome,
      turno: componente.turma.turno,
    },
    alunos: matriculas.map((matricula) => ({
      matriculaId: matricula.id,
      alunoId: matricula.aluno.usuario.id,
      nome: matricula.aluno.usuario.nome,
      status: matricula.status,
      ultimaFrequencia: presencaMaisRecente.get(matricula.id)
        ? {
            data: presencaMaisRecente.get(matricula.id)!.data.toISOString(),
            situacao: presencaMaisRecente.get(matricula.id)!.situacao,
          }
        : null,
    })),
  };
}

export async function listarRegistros(
  componenteId: string,
  user: UsuarioAutenticado
) {
  ensureProfessor(user);

  const registros = await prisma.diarioAula.findMany({
    where: {
      componenteCurricularId: componenteId,
      professorId: user.perfilId!,
      unidadeEscolarId: user.unidadeEscolarId!,
    },
    include: { registros_presenca: true, objetivos: true },
    orderBy: { data: "desc" },
  });

  return registros.map((registro) => {
    const resumo = registro.registros_presenca.reduce(
      (acc, presenca) => {
        if (presenca.situacao === SituacaoPresenca.PRESENTE) acc.presentes += 1;
        if (presenca.situacao === SituacaoPresenca.FALTA) acc.faltas += 1;
        if (presenca.situacao === SituacaoPresenca.FALTA_JUSTIFICADA)
          acc.faltasJustificadas += 1;
        return acc;
      },
      { presentes: 0, faltas: 0, faltasJustificadas: 0 }
    );

    return {
      id: registro.id,
      data: registro.data.toISOString(),
      objetivoCodigo: registro.objetivoCodigo,
      objetivoDescricao: registro.objetivoDescricao,
      objetivos: mapearObjetivosRegistro(registro),
      tema: registro.tema,
      atividade: registro.atividade,
      resumoPresencas: resumo,
    };
  });
}

export async function obterRegistro(
  diarioId: string,
  user: UsuarioAutenticado
) {
  ensureProfessor(user);
  const registro = await prisma.diarioAula.findFirst({
    where: {
      id: diarioId,
      professorId: user.perfilId!,
      unidadeEscolarId: user.unidadeEscolarId!,
    },
    include: {
      componenteCurricular: {
        select: {
          id: true,
          materia: { select: { nome: true } },
          turma: { select: { id: true, nome: true, serie: true } },
        },
      },
      objetivos: true,
      registros_presenca: {
        include: {
          matricula: {
            select: {
              id: true,
              status: true,
              aluno: { select: { usuario: { select: { nome: true } } } },
            },
          },
        },
      },
    },
  });

  if (!registro) {
    throw new Error("Registro de aula não encontrado.");
  }

  return {
    id: registro.id,
    data: registro.data.toISOString(),
    objetivoCodigo: registro.objetivoCodigo,
    objetivoDescricao: registro.objetivoDescricao,
    objetivos: mapearObjetivosRegistro(registro),
    tema: registro.tema,
    atividade: registro.atividade,
    componenteCurricular: registro.componenteCurricular,
    presencas: registro.registros_presenca.map((presenca) => ({
      matriculaId: presenca.matriculaId,
      aluno: presenca.matricula.aluno.usuario.nome,
      statusMatricula: presenca.matricula.status,
      situacao: presenca.situacao,
      observacao: presenca.observacao,
    })),
  };
}

export async function criarRegistro(
  input: CreateDiarioInput,
  user: UsuarioAutenticado
) {
  const componente = await obterComponenteDoProfessor(
    input.componenteCurricularId,
    user
  );

  const objetivosSelecionados = (input.objetivos || [])
    .map((objetivo) => ({
      codigo: objetivo.codigo?.trim(),
      descricao: objetivo.descricao?.trim(),
      etapa: objetivo.etapa ?? null,
      area: objetivo.area ?? null,
    }))
    .filter(
      (objetivo): objetivo is DiarioObjetivoInput & {
        etapa: string | null;
        area: string | null;
      } => Boolean(objetivo.codigo && objetivo.descricao)
    );

  const mapaObjetivos = new Map<string, DiarioObjetivoInput>();
  objetivosSelecionados.forEach((objetivo) => {
    if (!objetivo.codigo) return;
    if (!mapaObjetivos.has(objetivo.codigo)) {
      mapaObjetivos.set(objetivo.codigo, objetivo);
    }
  });

  const objetivos = Array.from(mapaObjetivos.values());

  if (!objetivos.length) {
    throw new Error(
      "Selecione ao menos um objetivo de aprendizagem da BNCC para registrar a aula."
    );
  }

  const principal = objetivos[0];
  const dataRegistro = new Date(`${input.data}T03:00:00.000Z`);

  const registro = await prisma.$transaction(async (tx) => {
    const criado = await tx.diarioAula.create({
      data: {
        data: dataRegistro,
        objetivoCodigo: principal.codigo,
        objetivoDescricao: principal.descricao,
        tema: input.tema,
        atividade: input.atividade,
        observacoes: input.observacoes,
        professorId: user.perfilId!,
        componenteCurricularId: componente.id,
        unidadeEscolarId: componente.turma.unidadeEscolarId,
      },
    });

    await tx.diarioAulaObjetivo.createMany({
      data: objetivos.map((objetivo) => ({
        diarioAulaId: criado.id,
        codigo: objetivo.codigo,
        descricao: objetivo.descricao,
        etapa: objetivo.etapa ?? undefined,
        area: objetivo.area ?? undefined,
      })),
    });

    return criado;
  });

  return registro;
}

export async function atualizarPresencas(
  diarioId: string,
  registros: PresencaInput[],
  user: UsuarioAutenticado
) {
  const diario = await prisma.diarioAula.findFirst({
    where: {
      id: diarioId,
      professorId: user.perfilId!,
      unidadeEscolarId: user.unidadeEscolarId!,
    },
    include: {
      componenteCurricular: { select: { turmaId: true } },
    },
  });

  if (!diario) {
    throw new Error("Registro de aula não encontrado para o professor.");
  }

  const matriculas = await prisma.matriculas.findMany({
    where: { turmaId: diario.componenteCurricular.turmaId },
    select: { id: true },
  });

  const matriculaPermitida = new Set(matriculas.map((m) => m.id));

  registros.forEach((registro) => {
    if (!matriculaPermitida.has(registro.matriculaId)) {
      throw new Error(
        "Há alunos que não pertencem à turma vinculada a este diário."
      );
    }
  });

  await prisma.$transaction([
    prisma.diarioAulaPresenca.deleteMany({ where: { diarioAulaId: diario.id } }),
    prisma.diarioAulaPresenca.createMany({
      data: registros.map((presenca) => ({
        diarioAulaId: diario.id,
        matriculaId: presenca.matriculaId,
        situacao: presenca.situacao,
        observacao: presenca.observacao,
      })),
    }),
  ]);

  return obterRegistro(diario.id, user);
}

export async function listarObjetivosBncc(
  componenteId: string,
  user: UsuarioAutenticado
) {
  const componente = await obterComponenteDoProfessor(componenteId, user);
  const disciplina = componente.materia.nome;
  const objetivos = await obterObjetivosBnccPorDisciplina(disciplina, {
    serie: componente.turma.serie,
  });

  return objetivos.map((objetivo) => ({
    codigo: objetivo.codigo,
    descricao: objetivo.descricao,
    etapa: objetivo.etapa ?? "EM",
    area: objetivo.area ?? null,
  }));
}

export async function listarFrequenciasDetalhadas(
  componenteId: string,
  user: UsuarioAutenticado
): Promise<FrequenciaDetalhadaResposta> {
  const componente = await obterComponenteDoProfessor(componenteId, user);

  const diarios = await prisma.diarioAula.findMany({
    where: {
      componenteCurricularId: componente.id,
      professorId: user.perfilId!,
      unidadeEscolarId: user.unidadeEscolarId!,
    },
    include: {
      registros_presenca: {
        include: {
          matricula: {
            select: {
              id: true,
              status: true,
              aluno: { select: { usuario: { select: { nome: true } } } },
            },
          },
        },
      },
      objetivos: true,
    },
    orderBy: { data: "desc" },
  });

  const totalAulas = diarios.length;
  const alunoMap = new Map<string, FrequenciaResumoAluno>();

  const matriculasTurma = await prisma.matriculas.findMany({
    where: { turmaId: componente.turma.id },
    select: {
      id: true,
      status: true,
      aluno: { select: { usuario: { select: { nome: true } } } },
    },
  });

  matriculasTurma.forEach((matricula) => {
    alunoMap.set(matricula.id, {
      matriculaId: matricula.id,
      aluno: matricula.aluno.usuario.nome,
      statusMatricula: matricula.status,
      totalAulasRegistradas: totalAulas,
      totalRegistradoParaAluno: 0,
      presentes: 0,
      faltas: 0,
      faltasJustificadas: 0,
      percentualPresenca: 0,
      presencas: [],
    });
  });

  const aulas = diarios.map((registro) => {
    const objetivosAula = mapearObjetivosRegistro(registro);
    const resumo = registro.registros_presenca.reduce(
      (acc, presenca) => {
        if (presenca.situacao === SituacaoPresenca.PRESENTE) acc.presentes += 1;
        if (presenca.situacao === SituacaoPresenca.FALTA) acc.faltas += 1;
        if (presenca.situacao === SituacaoPresenca.FALTA_JUSTIFICADA)
          acc.faltasJustificadas += 1;
        return acc;
      },
      { presentes: 0, faltas: 0, faltasJustificadas: 0 }
    );

    registro.registros_presenca.forEach((presenca) => {
      const matriculaId = presenca.matriculaId;
      const atual = alunoMap.get(matriculaId)!;
      atual.totalRegistradoParaAluno += 1;
      if (presenca.situacao === SituacaoPresenca.PRESENTE) {
        atual.presentes += 1;
      }
      if (presenca.situacao === SituacaoPresenca.FALTA) {
        atual.faltas += 1;
      }
      if (presenca.situacao === SituacaoPresenca.FALTA_JUSTIFICADA) {
        atual.faltasJustificadas += 1;
      }

      atual.presencas.push({
        diarioId: registro.id,
        data: registro.data.toISOString(),
        situacao: presenca.situacao,
        objetivoCodigo: registro.objetivoCodigo,
        objetivos: objetivosAula,
      });
    });

    return {
      id: registro.id,
      data: registro.data.toISOString(),
      objetivoCodigo: registro.objetivoCodigo,
      objetivoDescricao: registro.objetivoDescricao,
      objetivos: objetivosAula,
      tema: registro.tema,
      atividade: registro.atividade,
      presencas: registro.registros_presenca.map((presenca) => ({
        matriculaId: presenca.matriculaId,
        aluno: presenca.matricula.aluno.usuario.nome,
        situacao: presenca.situacao,
        statusMatricula: presenca.matricula.status,
        observacao: presenca.observacao,
      })),
      resumoPresencas: resumo,
    };
  });

  const alunos = Array.from(alunoMap.values())
    .map((aluno) => {
      const divisor = aluno.totalRegistradoParaAluno || totalAulas || 1;
      const percentual = Math.round(
        (aluno.presentes / divisor) * 100 * 100
      ) / 100;
      return {
        ...aluno,
        percentualPresenca: Number.isFinite(percentual) ? percentual : 0,
        presencas: aluno.presencas.sort((a, b) =>
          a.data < b.data ? 1 : a.data > b.data ? -1 : 0
        ),
      };
    })
    .sort((a, b) => a.aluno.localeCompare(b.aluno));

  return {
    componente: {
      id: componente.id,
      turmaId: componente.turma.id,
      nomeTurma: `${componente.turma.serie} ${componente.turma.nome}`,
      materia: componente.materia.nome,
    },
    totalAulas,
    aulas,
    alunos,
  };
}

export const diarioService = {
  listarTurmas,
  listarAlunos,
  listarRegistros,
  obterRegistro,
  criarRegistro,
  atualizarPresencas,
  listarObjetivosBncc,
  listarFrequenciasDetalhadas,
};
