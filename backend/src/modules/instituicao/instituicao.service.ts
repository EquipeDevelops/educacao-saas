import { Prisma, PrismaClient, PapelUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CreateInstituicaoInput } from "./instituicao.validator";

const prisma = new PrismaClient();

const createWithAdmin = (data: CreateInstituicaoInput) => {
  const { admin, ...instituicaoData } = data;

  return prisma.$transaction(async (tx) => {
    const novaInstituicao = await tx.instituicao.create({
      data: instituicaoData,
    });

    const senhaHash = await bcrypt.hash(admin.senha, 10);
    await tx.usuarios.create({
      data: {
        nome: admin.nome,
        email: admin.email,
        senha_hash: senhaHash,
        papel: PapelUsuario.ADMINISTRADOR,
        status: true,
        instituicaoId: novaInstituicao.id,
      },
    });

    return novaInstituicao;
  });
};

export const instituicaoService = {
  createWithAdmin,
  findAll: () => prisma.instituicao.findMany({ orderBy: { nome: "asc" } }),
  findById: (id: string) => prisma.instituicao.findUnique({ where: { id } }),
  update: (id: string, data: Prisma.InstituicaoUpdateInput) =>
    prisma.instituicao.update({ where: { id }, data }),
  remove: (id: string) => prisma.instituicao.delete({ where: { id } }),
};
