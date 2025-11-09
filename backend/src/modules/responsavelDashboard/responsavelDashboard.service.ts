import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { alunoDashboardService } from "../alunoDashboard/alunoDashboard.service";

const prisma = new PrismaClient();

type ResponsavelDashboardParams = {
  alunoId?: string;
};

export async function getResponsavelDashboard(
  user: AuthenticatedRequest["user"],
  params: ResponsavelDashboardParams = {}
) {
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

  const alunosVinculados = responsavel.alunos.map((relacao) => ({
    id: relacao.aluno.id,
    usuarioId: relacao.aluno.usuario.id,
    nome: relacao.aluno.usuario.nome,
    numero_matricula: relacao.aluno.numero_matricula,
    parentesco: relacao.parentesco,
    principal: relacao.principal,
  }));

  if (alunosVinculados.length === 0) {
    throw new Error("Nenhum aluno vinculado ao responsável.");
  }

  const alunoSelecionadoId =
    params.alunoId && alunosVinculados.some((aluno) => aluno.id === params.alunoId)
      ? params.alunoId
      : alunosVinculados.find((aluno) => aluno.principal)?.id ||
        alunosVinculados[0].id;

  const alunoSelecionado = alunosVinculados.find(
    (aluno) => aluno.id === alunoSelecionadoId,
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

  const dashboard = await alunoDashboardService.getDashboardData(alunoContext);

  return {
    alunoSelecionado,
    alunosVinculados,
    dashboard,
  };
}
