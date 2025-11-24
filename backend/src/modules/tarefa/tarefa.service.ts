import { Prisma, PrismaClient, StatusSubmissao, TipoTarefa } from "@prisma/client";
import {
  CreateTarefaInput,
  FindAllTarefasInput,
  TrabalhoManualGradeInput,
} from "./tarefa.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";
import {
  googleDriveService,
  GoogleDriveFile,
} from "../../services/googleDrive.service";
import { grade as gradeSubmissao } from "../submissao/submissao.service";

const prisma = new PrismaClient();

const fullInclude = {
  componenteCurricular: {
    include: {
      turma: {
        select: {
          nome: true,
          serie: true,
          _count: {
            select: { matriculas: true },
          },
        },
      },
      materia: { select: { nome: true } },
      professor: { select: { usuario: { select: { nome: true } } } },
    },
  },
  bimestre: true,
  _count: {
    select: { questoes: true, submissoes: true },
  },
};

async function verifyOwnership(tarefaId: string, professorId: string) {
  const tarefa = await prisma.tarefas.findUnique({
    where: { id: tarefaId },
    select: {
      componenteCurricular: { select: { professorId: true } },
    },
  });

  if (!tarefa) {
    const error = new Error("Tarefa não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }

  if (tarefa.componenteCurricular.professorId !== professorId) {
    const error = new Error(
      "Você não tem permissão para modificar esta tarefa."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }
}

async function ensureProvaSemSubmissoes(id: string) {
  const tarefa = await prisma.tarefas.findUnique({
    where: { id },
    select: { tipo: true },
  });

  if (!tarefa) {
    const error = new Error("Tarefa nao encontrada.");
    (error as any).code = "P2025";
    throw error;
  }

  if (tarefa.tipo !== TipoTarefa.PROVA) {
    return;
  }

  const entregas = await prisma.submissoes.count({
    where: { tarefaId: id },
  });

  if (entregas > 0) {
    const error = new Error(
      "Esta prova ja possui entregas e nao pode ser alterada."
    );
    (error as any).code = "HAS_SUBMISSIONS";
    throw error;
  }
}

export async function create(
  data: CreateTarefaInput,
  user: AuthenticatedRequest["user"]
) {
  if (!user.perfilId) {
    const error = new Error("Professor não autenticado corretamente.");
    (error as any).code = "FORBIDDEN";
    throw error;
  }
  const professorId = user.perfilId;

  const componente = await prisma.componenteCurricular.findFirst({
    where: {
      id: data.componenteCurricularId,
      professorId,
    },
    select: {
      ano_letivo: true,
      turma: { select: { unidadeEscolarId: true } },
    },
  });

  if (!componente) {
    const error = new Error(
      "Você não tem permissão para criar tarefas para este componente curricular."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  const referencia = new Date();
  const unidadeEscolarId = componente.turma.unidadeEscolarId;
  const anoLetivo = componente.ano_letivo;

  const bimestreVigente = await prisma.bimestres.findFirst({
    where: {
      unidadeEscolarId,
      anoLetivo,
      dataInicio: { lte: referencia },
      dataFim: { gte: referencia },
    },
    orderBy: { dataInicio: "asc" },
  });

  if (!bimestreVigente) {
    const error = new Error(
      "Nenhum bimestre vigente configurado para esta unidade escolar e ano letivo. Solicite ao gestor o cadastro."
    );
    (error as any).code = "NO_ACTIVE_BIMESTRE";
    throw error;
  }

  const metadata = {
    ...(data.metadata ?? {}),
    anexos: Array.isArray((data.metadata as any)?.anexos)
      ? (data.metadata as any).anexos
      : [],
  } as Prisma.JsonObject;

  return prisma.tarefas.create({
    data: {
      ...data,
      metadata,
      unidadeEscolarId,
      bimestreId: bimestreVigente.id,
    },
    include: fullInclude,
  });
}

export async function findAll(
  user: AuthenticatedRequest["user"],
  filters: FindAllTarefasInput
) {
  const where: Prisma.TarefasWhereInput = {};

  if (user.papel === "GESTOR") {
    where.unidadeEscolarId = user.unidadeEscolarId;
  }

  if (filters.componenteCurricularId) {
    where.componenteCurricularId = filters.componenteCurricularId;
  }

  if (filters.bimestreId) {
    where.bimestreId = filters.bimestreId;
  }

  if (user.papel === "ALUNO") {
    const matricula = await prisma.matriculas.findFirst({
      where: {
        aluno: { usuarioId: user.id },
        status: "ATIVA",
      },
      select: { turmaId: true },
    });

    if (!matricula) {
      return [];
    }

    where.publicado = true;
    where.componenteCurricular = {
      turmaId: matricula.turmaId,
    };
  }

  if (user.papel === "PROFESSOR") {
    where.componenteCurricular = { professorId: user.perfilId! };
  }

  return prisma.tarefas.findMany({ where, include: fullInclude });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  const tarefa = await prisma.tarefas.findUnique({
    where: { id },
    include: fullInclude,
  });

  if (!tarefa) return null;

  if (
    user.papel === "PROFESSOR" &&
    tarefa.componenteCurricular.professorId !== user.perfilId
  ) {
    return null;
  }

  if (
    (user.papel === "GESTOR" || user.papel === "ALUNO") &&
    tarefa.unidadeEscolarId !== user.unidadeEscolarId
  ) {
    return null;
  }

  return tarefa;
}

export async function update(
  id: string,
  data: Prisma.TarefasUpdateInput,
  user: AuthenticatedRequest["user"]
) {
  if (!user.perfilId) {
    const error = new Error("Professor não autenticado corretamente.");
    (error as any).code = "FORBIDDEN";
    throw error;
  }
  await verifyOwnership(id, user.perfilId);
  await ensureProvaSemSubmissoes(id);
  return prisma.tarefas.update({ where: { id }, data });
}

export async function addAttachments(
  id: string,
  files: Express.Multer.File[],
  user: AuthenticatedRequest["user"]
) {
  if (!user.perfilId) {
    const error = new Error("Professor não autenticado corretamente.");
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  await verifyOwnership(id, user.perfilId);

  const tarefa = await prisma.tarefas.findUnique({
    where: { id },
    select: { metadata: true },
  });

  if (!tarefa) {
    const error = new Error("Tarefa não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }

  const uploadedAttachments: GoogleDriveFile[] = [];

  for (const file of files) {
    const uploaded = await googleDriveService.uploadFile({
      buffer: file.buffer,
      mimeType: file.mimetype,
      name: file.originalname,
    });
    uploadedAttachments.push(uploaded);
  }

  const currentMetadata = (tarefa.metadata as Record<string, any>) ?? {};
  const existingAttachments = Array.isArray(currentMetadata.anexos)
    ? currentMetadata.anexos
    : [];

  const anexosAtualizados = [...existingAttachments, ...uploadedAttachments];

  const metadataAtualizada: Prisma.JsonObject = {
    ...currentMetadata,
    anexos: anexosAtualizados,
  };

  await prisma.tarefas.update({
    where: { id },
    data: { metadata: metadataAtualizada },
  });

  return anexosAtualizados;
}

async function getTrabalhoCorrecaoResumo(
  id: string,
  user: AuthenticatedRequest["user"]
) {
  if (!user.perfilId) {
    const error = new Error(
      "Voc� n�o tem permiss�o para acessar esta tarefa."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  const tarefa = await prisma.tarefas.findFirst({
    where: {
      id,
      componenteCurricular: { professorId: user.perfilId },
    },
    select: {
      id: true,
      titulo: true,
      tipo: true,
      pontos: true,
      componenteCurricular: {
        select: {
          turmaId: true,
          turma: { select: { nome: true, serie: true } },
        },
      },
    },
  });

  if (!tarefa) {
    const error = new Error("Tarefa n�o encontrada.");
    (error as any).code = "NOT_FOUND";
    throw error;
  }

  if (tarefa.tipo !== TipoTarefa.TRABALHO) {
    const error = new Error(
      "As avalia��es manuais est�o dispon�veis apenas para trabalhos."
    );
    (error as any).code = "INVALID_TIPO";
    throw error;
  }

  const matriculas = await prisma.matriculas.findMany({
    where: {
      turmaId: tarefa.componenteCurricular.turmaId,
      status: "ATIVA",
    },
    select: {
      id: true,
      alunoId: true,
      aluno: {
        select: {
          usuarioId: true,
        },
      },
    },
    orderBy: {
      aluno: {
        usuario: {
          nome: "asc",
        },
      },
    },
  });

  const alunoIds = matriculas
    .map((matricula) => matricula.alunoId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const usuarioIds = matriculas
    .map((matricula) => matricula.aluno?.usuarioId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const matriculaIds = matriculas
    .map((matricula) => matricula.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const [submissoes, avaliacoes] = await Promise.all([
    alunoIds.length
      ? prisma.submissoes.findMany({
          where: {
            tarefaId: id,
            alunoId: { in: alunoIds },
          },
          select: {
            id: true,
            alunoId: true,
            nota_total: true,
            status: true,
            feedback: true,
            atualizado_em: true,
            enviado_em: true,
          },
        })
      : Promise.resolve([]),
    matriculaIds.length
      ? prisma.avaliacaoParcial.findMany({
          where: {
            tarefaId: id,
            matriculaId: { in: matriculaIds },
          },
          select: { id: true, nota: true, data: true, matriculaId: true },
        })
      : Promise.resolve([]),
  ]);

  const submissaoMap = new Map(submissoes.map((s) => [s.alunoId, s]));
  const avaliacaoMap = new Map(avaliacoes.map((a) => [a.matriculaId, a]));
  const usuarios =
    usuarioIds.length > 0
      ? await prisma.usuarios.findMany({
          where: { id: { in: usuarioIds } },
          select: { id: true, nome: true },
        })
      : [];
  const usuarioMap = new Map(usuarios.map((u) => [u.id, u.nome]));

  const alunos = matriculas.map((matricula) => {
    const submissao = submissaoMap.get(matricula.alunoId);
    const avaliacao = avaliacaoMap.get(matricula.id);
    const usuarioId = matricula.aluno?.usuarioId ?? null;

    const nota =
      typeof avaliacao?.nota === "number"
        ? avaliacao.nota
        : typeof submissao?.nota_total === "number"
        ? submissao.nota_total
        : null;

    const ultimaAtualizacao =
      avaliacao?.data instanceof Date
        ? avaliacao.data.toISOString()
        : submissao?.atualizado_em instanceof Date
        ? submissao.atualizado_em.toISOString()
        : submissao?.enviado_em instanceof Date
        ? submissao.enviado_em.toISOString()
        : null;

    const status =
      nota !== null || submissao?.status === StatusSubmissao.AVALIADA
        ? "AVALIADO"
        : "PENDENTE";

    const nomeAluno =
      (usuarioId ? usuarioMap.get(usuarioId) : null) ?? "Aluno sem cadastro";

    return {
      matriculaId: matricula.id,
      alunoPerfilId: matricula.alunoId,
      alunoUsuarioId: usuarioId ?? "",
      nome: nomeAluno,
      nota,
      ultimaAtualizacao,
      feedback: submissao?.feedback ?? null,
      submissaoId: submissao?.id ?? null,
      status,
    };
  });

  const avaliados = alunos.filter((aluno) => aluno.status === "AVALIADO").length;

  return {
    tarefa: {
      id: tarefa.id,
      titulo: tarefa.titulo,
      tipo: tarefa.tipo,
      pontos: tarefa.pontos,
      turma: `${tarefa.componenteCurricular.turma?.serie ?? ""} ${
        tarefa.componenteCurricular.turma?.nome ?? ""
      }`.trim(),
    },
    resumo: {
      totalAlunos: alunos.length,
      avaliados,
      pendentes: Math.max(alunos.length - avaliados, 0),
    },
    alunos,
  };
}

async function gradeTrabalhoAluno(
  id: string,
  corpo: TrabalhoManualGradeInput,
  user: AuthenticatedRequest["user"]
) {
  if (!user.perfilId || !user.unidadeEscolarId) {
    const error = new Error(
      "Voc� n�o tem permiss�o para registrar notas nesta tarefa."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  const tarefa = await prisma.tarefas.findFirst({
    where: {
      id,
      componenteCurricular: { professorId: user.perfilId },
    },
    select: {
      id: true,
      tipo: true,
      pontos: true,
      unidadeEscolarId: true,
      componenteCurricular: { select: { turmaId: true } },
    },
  });

  if (!tarefa) {
    const error = new Error("Tarefa n�o encontrada.");
    (error as any).code = "NOT_FOUND";
    throw error;
  }

  if (tarefa.tipo !== TipoTarefa.TRABALHO) {
    const error = new Error(
      "Somente trabalhos podem ser avaliados manualmente."
    );
    (error as any).code = "INVALID_TIPO";
    throw error;
  }

  const notaMaxima = tarefa.pontos ?? 10;
  if (corpo.nota > notaMaxima) {
    const error = new Error(
      `A nota n�o pode ser maior que ${notaMaxima.toFixed(1)} pontos.`
    );
    (error as any).code = "INVALID_NOTE_RANGE";
    throw error;
  }

  const matricula = await prisma.matriculas.findFirst({
    where: {
      alunoId: corpo.alunoId,
      turmaId: tarefa.componenteCurricular.turmaId,
      status: "ATIVA",
    },
    select: { id: true },
  });

  if (!matricula) {
    const error = new Error(
      "N�o foi poss�vel localizar uma matr�cula ativa deste aluno para a turma do trabalho."
    );
    (error as any).code = "MATRICULA_NOT_FOUND";
    throw error;
  }

  let submissao = await prisma.submissoes.findFirst({
    where: { tarefaId: tarefa.id, alunoId: corpo.alunoId },
    select: { id: true },
  });

  if (!submissao) {
    const metadados: Prisma.JsonObject = {
      criadoManualmente: true,
      origem: "correcao_trabalho_presencial",
    };

    submissao = await prisma.submissoes.create({
      data: {
        tarefaId: tarefa.id,
        alunoId: corpo.alunoId,
        unidadeEscolarId: tarefa.unidadeEscolarId,
        status: StatusSubmissao.ENVIADA,
        enviado_em: new Date(),
        metadados,
      },
      select: { id: true },
    });
  }

  const unidadeEscolarContext =
    tarefa.unidadeEscolarId ?? user.unidadeEscolarId;

  return gradeSubmissao(
    submissao.id,
    { nota_total: corpo.nota, feedback: corpo.feedback },
    { ...user, unidadeEscolarId: unidadeEscolarContext }
  );
}

export async function publish(
  id: string,
  publicado: boolean,
  user: AuthenticatedRequest["user"]
) {
  if (!user.perfilId) {
    const error = new Error("Professor não autenticado corretamente.");
    (error as any).code = "FORBIDDEN";
    throw error;
  }
  await verifyOwnership(id, user.perfilId);
  return prisma.tarefas.update({ where: { id }, data: { publicado } });
}

export async function remove(id: string, user: AuthenticatedRequest["user"]) {
  console.log("[DEBUG] Tentando deletar tarefa com ID:", id);

  if (!user.perfilId) {
    const error = new Error("Professor não autenticado corretamente.");
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  await verifyOwnership(id, user.perfilId);
  await ensureProvaSemSubmissoes(id);
  console.log("[DEBUG] Ownership verificada com sucesso");

  try {
    const result = await prisma.tarefas.delete({
      where: { id },
    });

    console.log("[DEBUG] Tarefa deletada com sucesso via cascade");
    return result;
  } catch (error) {
    console.log("[DEBUG] Erro ao deletar tarefa:", error);
    throw error;
  }
}

export const tarefaService = {
  create,
  findAll,
  findById,
  update,
  publish,
  remove,
  addAttachments,
  getTrabalhoCorrecaoResumo,
  gradeTrabalhoAluno,
};
