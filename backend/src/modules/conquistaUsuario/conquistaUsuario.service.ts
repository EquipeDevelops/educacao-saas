import { Prisma, PrismaClient } from "@prisma/client";
import {
  GrantConquistaInput,
  FindAllConquistasUsuarioInput,
} from "./conquistaUsuario.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();
const fullInclude = {
  conquista: true,
  aluno_perfil: {
    include: {
      usuario: { select: { id: true, nome: true } },
    },
  },
};

export async function grant(
  data: GrantConquistaInput,
  user: AuthenticatedRequest["user"]
) {
  const { alunoPerfilId, conquistaId } = data;
  const { unidadeEscolarId } = user;

  const [aluno, conquistaDisponivel] = await Promise.all([
    prisma.usuarios_aluno.findFirst({
      where: { id: alunoPerfilId, usuario: { unidadeEscolarId } },
    }),
    prisma.conquistasPorUnidade.findFirst({
      where: { conquistaId, unidadeEscolarId: unidadeEscolarId! },
    }),
  ]);

  if (!aluno || !conquistaDisponivel) {
    throw new Error(
      "Aluno não encontrado ou conquista não está ativa para este colégio."
    );
  }

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
  user: AuthenticatedRequest["user"],
  filters: FindAllConquistasUsuarioInput
) {
  const where: Prisma.Conquistas_UsuariosWhereInput = {
    aluno_perfil: { usuario: { unidadeEscolarId: user.unidadeEscolarId } },
  };

  if (user.papel === "ALUNO") {
    filters.alunoPerfilId = user.perfilId!;
  }

  if (filters.alunoPerfilId) where.alunoPerfilId = filters.alunoPerfilId;
  if (filters.conquistaId) where.conquistaId = filters.conquistaId;

  return prisma.conquistas_Usuarios.findMany({
    where,
    include: fullInclude,
    orderBy: { concedido_em: "desc" },
  });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  return prisma.conquistas_Usuarios.findFirst({
    where: {
      id,
      aluno_perfil: { usuario: { unidadeEscolarId: user.unidadeEscolarId } },
    },
    include: fullInclude,
  });
}

export async function revoke(id: string, user: AuthenticatedRequest["user"]) {
  const conquistaUsuario = await findById(id, user);
  if (!conquistaUsuario) {
    throw new Error(
      "Registro de conquista não encontrado ou sem permissão para revogar."
    );
  }
  return prisma.conquistas_Usuarios.delete({
    where: { id },
  });
}

export const conquistaUsuarioService = { grant, findAll, findById, revoke };
