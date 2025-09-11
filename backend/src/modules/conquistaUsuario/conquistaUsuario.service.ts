import prisma from "../../utils/prisma";
import { AwardConquistaInput } from "./conquistaUsuario.validator";

export const conquistaUsuarioService = {
  award: async (data: AwardConquistaInput) => {
    const [usuario, conquista] = await Promise.all([
      prisma.usuarios.findUnique({ where: { id: data.usuarioId } }),
      prisma.conquistas.findUnique({ where: { id: data.conquistaId } }),
    ]);

    if (!usuario) throw new Error("Usuário não encontrado.");
    if (!conquista) throw new Error("Conquista não encontrada.");
    if (usuario.instituicaoId !== conquista.instituicaoId) {
      throw new Error("Usuário e Conquista não pertencem à mesma instituição.");
    }

    const jaPossui = await prisma.conquistas_Usuarios.findFirst({
      where: data,
    });
    if (jaPossui) {
      throw new Error("Este usuário já possui esta conquista.");
    }

    return await prisma.conquistas_Usuarios.create({ data });
  },

  findAllByUsuario: async (usuarioId: string) => {
    return await prisma.conquistas_Usuarios.findMany({
      where: { usuarioId },
      orderBy: { concedido_em: "desc" },
      include: { conquista: true },
    });
  },

  findAllByConquista: async (conquistaId: string) => {
    return await prisma.conquistas_Usuarios.findMany({
      where: { conquistaId },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
    });
  },

  revoke: async (id: string) => {
    return await prisma.conquistas_Usuarios.delete({ where: { id } });
  },
};
