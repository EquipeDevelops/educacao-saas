import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { alunoDashboardService } from "../alunoDashboard/alunoDashboard.service";
import { alunoService } from "../aluno/aluno.service";
import * as tarefaService from "../tarefa/tarefa.service";
import { findAll as listarSubmissoes } from "../submissao/submissao.service";

const prisma = new PrismaClient();

type ResponsavelDashboardParams = {
  alunoId?: string;
};

type ResponsavelAluno = {
  id: string;
  usuarioId: string;
  nome: string;
  numero_matricula: string;
  parentesco?: string | null;
  principal: boolean;
};

type ResponsavelAlunoContext = {
  alunosVinculados: ResponsavelAluno[];
  alunoSelecionado: ResponsavelAluno;
  alunoContext: AuthenticatedRequest["user"];
};

async function resolveAlunoContext(
  user: AuthenticatedRequest["user"],
  params: ResponsavelDashboardParams = {}
): Promise<ResponsavelAlunoContext> {
  if (!user.responsavelPerfilId) {
    throw new Error("Usuário não é um responsável válido.");
  }

  const responsavel = await prisma.usuarios_responsavel.findUnique({
    where: { id: user.responsavelPerfilId },
    include: {
      alunos: {
        include: {
          aluno: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome: true,
                  instituicaoId: true,
                  unidadeEscolarId: true,
                  papel: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!responsavel) {
    throw new Error("Perfil de responsável não encontrado.");
  }

  const alunosVinculados: ResponsavelAluno[] = responsavel.alunos.map(
    (relacao) => ({
      id: relacao.aluno.id,
      usuarioId: relacao.aluno.usuario.id,
      nome: relacao.aluno.usuario.nome,
      numero_matricula: relacao.aluno.numero_matricula,
      parentesco: relacao.parentesco,
      principal: relacao.principal,
    })
  );

  if (alunosVinculados.length === 0) {
    throw new Error("Nenhum aluno vinculado ao responsável.");
  }

  const alunoSelecionadoId =
    params.alunoId && alunosVinculados.some((aluno) => aluno.id === params.alunoId)
      ? params.alunoId
      : alunosVinculados.find((aluno) => aluno.principal)?.id ||
        alunosVinculados[0].id;

  const alunoSelecionado = alunosVinculados.find(
    (aluno) => aluno.id === alunoSelecionadoId
  );

  if (!alunoSelecionado) {
    throw new Error("Aluno selecionado não encontrado para este responsável.");
  }

  const alunoUsuario = await prisma.usuarios.findUnique({
    where: { id: alunoSelecionado.usuarioId },
    select: {
      id: true,
      instituicaoId: true,
      unidadeEscolarId: true,
      papel: true,
      nome: true,
    },
  });

  if (!alunoUsuario) {
    throw new Error("Usuário do aluno não encontrado.");
  }

  const alunoContext: AuthenticatedRequest["user"] = {
    id: alunoUsuario.id,
    instituicaoId: alunoUsuario.instituicaoId,
    unidadeEscolarId: alunoUsuario.unidadeEscolarId,
    papel: alunoUsuario.papel,
    perfilId: alunoSelecionado.id,
    nome: alunoUsuario.nome,
    responsavelPerfilId: null,
    responsavelAlunoIds: [],
  };

  return {
    alunosVinculados,
    alunoSelecionado,
    alunoContext,
  };
}

export async function getResponsavelDashboard(
  user: AuthenticatedRequest["user"],
  params: ResponsavelDashboardParams = {}
) {
  const { alunosVinculados, alunoSelecionado, alunoContext } =
    await resolveAlunoContext(user, params);

  const dashboard = await alunoDashboardService.getDashboardData(alunoContext);

  return {
    alunoSelecionado,
    alunosVinculados,
    dashboard,
  };
}

export async function getResponsavelBoletim(
  user: AuthenticatedRequest["user"],
  params: ResponsavelDashboardParams = {}
) {
  const { alunosVinculados, alunoSelecionado } = await resolveAlunoContext(
    user,
    params
  );

  const boletim = await alunoService.getBoletim(alunoSelecionado.usuarioId);

  return {
    alunosVinculados,
    alunoSelecionado,
    boletim,
  };
}

export async function getResponsavelAgenda(
  user: AuthenticatedRequest["user"],
  params: ResponsavelDashboardParams & {
    startDate: Date;
    endDate: Date;
  }
) {
  const { alunosVinculados, alunoSelecionado, alunoContext } =
    await resolveAlunoContext(user, params);

  const eventos = await alunoService.getAgendaEventos(
    alunoContext,
    params.startDate,
    params.endDate
  );

  return {
    alunosVinculados,
    alunoSelecionado,
    eventos,
  };
}

export async function getResponsavelAtividades(
  user: AuthenticatedRequest["user"],
  params: ResponsavelDashboardParams = {}
) {
  const { alunosVinculados, alunoSelecionado, alunoContext } =
    await resolveAlunoContext(user, params);

  const [tarefas, submissoes] = await Promise.all([
    tarefaService.findAll(alunoContext, {}),
    listarSubmissoes(alunoContext, {}),
  ]);

  const submissoesMap = new Map(
    submissoes.map((submissao) => [submissao.tarefaId, submissao])
  );

  const tarefasComSubmissao = tarefas.map((tarefa) => ({
    ...tarefa,
    submissao: submissoesMap.get(tarefa.id) ?? null,
  }));

  const agora = Date.now();

  const isConclusao = (status: string | undefined | null) =>
    status === "AVALIADA" ||
    status === "ENVIADA" ||
    status === "ENVIADA_COM_ATRASO";

  const realizadas: typeof tarefasComSubmissao = [];
  const pendentes: typeof tarefasComSubmissao = [];
  const atrasadas: typeof tarefasComSubmissao = [];

  tarefasComSubmissao.forEach((tarefa) => {
    const status = tarefa.submissao?.status ?? null;
    if (isConclusao(status)) {
      realizadas.push(tarefa);
      return;
    }

    const dataEntrega = new Date(tarefa.data_entrega).getTime();
    if (!Number.isFinite(dataEntrega)) {
      pendentes.push(tarefa);
      return;
    }

    if (dataEntrega < agora) {
      atrasadas.push(tarefa);
    } else {
      pendentes.push(tarefa);
    }
  });

  return {
    alunosVinculados,
    alunoSelecionado,
    atividades: {
      realizadas,
      pendentes,
      atrasadas,
    },
  };
}
