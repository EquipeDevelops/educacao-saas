import { Prisma, PrismaClient } from "@prisma/client";
import {
  GrantConquistaInput,
  FindAllConquistasUsuarioInput,
} from "./conquistaUsuario.validator";

const prisma = new PrismaClient();

const fullInclude = {
  conquista: true,
  aluno_perfil: {
    include: {
      usuario: { select: { id: true, nome: true } },
    },
  },
};

export async function grant(data: GrantConquistaInput, instituicaoId: string) {
  const { alunoPerfilId, conquistaId } = data;

  // SEGURANÇA: Valida se o aluno e a conquista pertencem à mesma instituição.
  const [aluno, conquista] = await Promise.all([
    prisma.usuarios_aluno.findFirst({
      where: { id: alunoPerfilId, usuario: { instituicaoId } },
    }),
    prisma.conquistas.findFirst({ where: { id: conquistaId, instituicaoId } }),
  ]);

  if (!aluno || !conquista) {
    throw new Error("Aluno ou Conquista não encontrado na sua instituição.");
  }

  // REGRA DE NEGÓCIO: Previne que um aluno receba a mesma conquista duas vezes.
  const conquistaExistente = await prisma.conquistas_Usuarios.findFirst({
    where: { alunoPerfilId, conquistaId },
  });
  if (conquistaExistente) {
    throw new Error("Este aluno já possui esta conquista.");
  }

  return prisma.conquistas_Usuarios.create({
    data,
    include: fullInclude,
  });
}

export async function findAll(
  instituicaoId: string,
  filters: FindAllConquistasUsuarioInput
) {
  const where: Prisma.Conquistas_UsuariosWhereInput = {
    // SEGURANÇA: Filtro base garantindo o escopo da instituição.
    aluno_perfil: { usuario: { instituicaoId } },
  };

  if (filters.alunoPerfilId) where.alunoPerfilId = filters.alunoPerfilId;
  if (filters.conquistaId) where.conquistaId = filters.conquistaId;

  return prisma.conquistas_Usuarios.findMany({
    where,
    include: fullInclude,
    orderBy: { concedido_em: "desc" },
  });
}

export async function findById(id: string, instituicaoId: string) {
  return prisma.conquistas_Usuarios.findFirst({
    where: { id, aluno_perfil: { usuario: { instituicaoId } } },
    include: fullInclude,
  });
}

export async function revoke(id: string, instituicaoId: string) {
  // SEGURANÇA: Garante que a revogação só pode ser feita em um registro da instituição correta.
  return prisma.conquistas_Usuarios.deleteMany({
    where: {
      id,
      aluno_perfil: { usuario: { instituicaoId } },
    },
  });
}

export const conquistaUsuarioService = { grant, findAll, findById, revoke };
