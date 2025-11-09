import {
  PeriodoAvaliacao,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";
import {
  CreateAvaliacaoInput,
  FindAllAvaliacoesInput,
  UpdateAvaliacaoInput,
} from "./avaliacaoParcial.validator";

const prisma = new PrismaClient();

const fullInclude = {
  matricula: {
    include: {
      aluno: { include: { usuario: { select: { id: true, nome: true } } } },
      turma: { select: { nome: true, serie: true } },
    },
  },
  componenteCurricular: { include: { materia: { select: { nome: true } } } },
  bimestre: true,
  tarefa: { select: { id: true, titulo: true, tipo: true } },
};

const parseDate = (value: string): Date => {
  const converted = new Date(value);
  if (Number.isNaN(converted.getTime())) {
    throw new Error("Data informada inválida.");
  }
  return converted;
};

type BimestreResumo = {
  id: string;
  periodo: PeriodoAvaliacao;
  dataInicio: Date;
  dataFim: Date;
};

async function resolveBimestre(
  unidadeEscolarId: string,
  referencia: Date,
  bimestreId?: string
): Promise<BimestreResumo> {
  if (bimestreId) {
    const bimestre = await prisma.bimestres.findFirst({
      where: { id: bimestreId, unidadeEscolarId },
      select: { id: true, periodo: true, dataInicio: true, dataFim: true },
    });

    if (!bimestre) {
      throw new Error("Bimestre informado não encontrado na sua unidade escolar.");
    }

    const dentroDoPeriodo =
      referencia >= bimestre.dataInicio && referencia <= bimestre.dataFim;
    if (!dentroDoPeriodo) {
      throw new Error(
        "A data informada não pertence ao intervalo do bimestre selecionado."
      );
    }

    return bimestre;
  }

  const vigente = await prisma.bimestres.findFirst({
    where: {
      unidadeEscolarId,
      dataInicio: { lte: referencia },
      dataFim: { gte: referencia },
    },
    select: { id: true, periodo: true, dataInicio: true, dataFim: true },
    orderBy: { dataInicio: "asc" },
  });

  if (!vigente) {
    throw new Error(
      "Nenhum bimestre vigente configurado para a data informada. Solicite ao gestor o cadastro."
    );
  }

  return vigente;
}

async function verifyConsistencyAndOwnership(
  matriculaId: string,
  componenteCurricularId: string,
  professorId: string,
  unidadeEscolarId: string
) {
  const [componente, matricula] = await Promise.all([
    prisma.componenteCurricular.findFirst({
      where: {
        id: componenteCurricularId,
        professorId,
        turma: { unidadeEscolarId },
      },
    }),
    prisma.matriculas.findFirst({
      where: { id: matriculaId, turma: { unidadeEscolarId } },
    }),
  ]);

  if (!componente || !matricula) {
    throw new Error(
      "Matrícula ou Componente Curricular não encontrado na sua unidade escolar."
    );
  }

  if (componente.turmaId !== matricula.turmaId) {
    throw new Error(
      "Este aluno não pertence à turma deste componente curricular."
    );
  }
}

export async function create(
  data: CreateAvaliacaoInput,
  user: AuthenticatedRequest["user"]
) {
  const { perfilId: professorId, unidadeEscolarId } = user;

  await verifyConsistencyAndOwnership(
    data.matriculaId,
    data.componenteCurricularId,
    professorId!,
    unidadeEscolarId!
  );

  const dataAvaliacao = parseDate(data.data);
  const bimestre = await resolveBimestre(
    unidadeEscolarId!,
    dataAvaliacao,
    data.bimestreId
  );

  return prisma.avaliacaoParcial.create({
    data: {
      nota: data.nota,
      tipo: data.tipo,
      periodo: bimestre.periodo,
      data: dataAvaliacao,
      matricula: { connect: { id: data.matriculaId } },
      componenteCurricular: {
        connect: { id: data.componenteCurricularId },
      },
      bimestre: { connect: { id: bimestre.id } },
      ...(data.tarefaId ? { tarefa: { connect: { id: data.tarefaId } } } : {}),
    },
    include: fullInclude,
  });
}

export async function findAll(
  user: AuthenticatedRequest["user"],
  filters: FindAllAvaliacoesInput
) {
  const where: Prisma.AvaliacaoParcialWhereInput = {
    matricula: { turma: { unidadeEscolarId: user.unidadeEscolarId } },
  };

  if (user.papel === "ALUNO") {
    const matricula = await prisma.matriculas.findFirst({
      where: { aluno: { usuarioId: user.id }, status: "ATIVA" },
    });
    filters.matriculaId = matricula?.id || "nenhuma-matricula-encontrada";
  }

  if (filters.matriculaId) where.matriculaId = filters.matriculaId;
  if (filters.componenteCurricularId)
    where.componenteCurricularId = filters.componenteCurricularId;
  if (filters.bimestreId) where.bimestreId = filters.bimestreId;

  return prisma.avaliacaoParcial.findMany({ where, include: fullInclude });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  return prisma.avaliacaoParcial.findFirst({
    where: {
      id,
      matricula: { turma: { unidadeEscolarId: user.unidadeEscolarId } },
    },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: UpdateAvaliacaoInput,
  user: AuthenticatedRequest["user"]
) {
  const { perfilId: professorId, unidadeEscolarId } = user;
  const avaliacao = await findById(id, user);
  if (!avaliacao) {
    const error = new Error("Avaliação não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }

  await verifyConsistencyAndOwnership(
    avaliacao.matriculaId,
    avaliacao.componenteCurricularId,
    professorId!,
    unidadeEscolarId!
  );

  const updates: Prisma.AvaliacaoParcialUpdateInput = {};

  if (typeof data.nota === "number") {
    updates.nota = data.nota;
  }

  if (data.tipo) {
    updates.tipo = data.tipo;
  }

  let bimestre: BimestreResumo | null = null;

  if (data.data || data.bimestreId) {
    const referencia = data.data ? parseDate(data.data) : avaliacao.data;
    bimestre = await resolveBimestre(
      unidadeEscolarId!,
      referencia,
      data.bimestreId
    );
    updates.periodo = bimestre.periodo;
    updates.bimestre = { connect: { id: bimestre.id } };

    if (data.data) {
      updates.data = referencia;
    }
  }

  if (data.tarefaId) {
    updates.tarefa = { connect: { id: data.tarefaId } };
  }

  if (Object.keys(updates).length === 0) {
    return avaliacao;
  }

  return prisma.avaliacaoParcial.update({
    where: { id },
    data: updates,
    include: fullInclude,
  });
}
  
export async function remove(id: string, user: AuthenticatedRequest["user"]) {
  const { perfilId: professorId, unidadeEscolarId } = user;
  const avaliacao = await findById(id, user);
  if (!avaliacao) {
    const error = new Error("Avaliação não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyConsistencyAndOwnership(
    avaliacao.matriculaId,
    avaliacao.componenteCurricularId,
    professorId!,
    unidadeEscolarId!
  );
  return prisma.avaliacaoParcial.delete({ where: { id } });
}

export const avaliacaoService = { create, findAll, findById, update, remove };
