import { Prisma, PrismaClient, PapelUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CreateUnidadeInput } from "./unidadeEscolar.validator";

const prisma = new PrismaClient();

const createWithGestor = async (
  data: CreateUnidadeInput,
  instituicaoId: string
) => {
  const { gestor, ...unidadeData } = data;

  // --- LOG DE DEPURAÇÃO ---
  console.log("\n--- [SERVIÇO] Iniciando createWithGestor ---");
  console.log("Dados da Unidade:", unidadeData);
  console.log("Dados do Gestor:", gestor);
  console.log("ID da Instituição:", instituicaoId);
  // --- FIM DO LOG ---

  return prisma.$transaction(async (tx) => {
    console.log(
      "[SERVIÇO] Dentro da transação. Tentando criar a Unidade Escolar..."
    );

    const novaUnidade = await tx.unidades_Escolares.create({
      data: {
        ...unidadeData,
        instituicaoId,
      },
    });

    console.log(
      "[SERVIÇO] Unidade Escolar criada com sucesso. ID:",
      novaUnidade.id
    );
    console.log("[SERVIÇO] Gerando hash da senha para o gestor...");

    const senhaHash = await bcrypt.hash(gestor.senha, 10);

    console.log("[SERVIÇO] Hash gerado. Tentando criar o usuário Gestor...");

    await tx.usuarios.create({
      data: {
        nome: gestor.nome,
        email: gestor.email,
        senha_hash: senhaHash,
        papel: PapelUsuario.GESTOR,
        status: true,
        instituicaoId: instituicaoId,
        unidadeEscolarId: novaUnidade.id,
      },
    });

    console.log("[SERVIÇO] Usuário Gestor criado com sucesso.");

    return novaUnidade;
  });
};

// O restante do serviço permanece o mesmo
export const unidadeEscolarService = {
  createWithGestor,
  findAll: (instituicaoId: string) =>
    prisma.unidades_Escolares.findMany({
      where: { instituicaoId },
      orderBy: { nome: "asc" },
    }),
  findById: (id: string, instituicaoId: string) =>
    prisma.unidades_Escolares.findFirst({ where: { id, instituicaoId } }),
  update: (
    id: string,
    data: Prisma.Unidades_EscolaresUpdateInput,
    instituicaoId: string
  ) =>
    prisma.unidades_Escolares.updateMany({
      where: { id, instituicaoId },
      data,
    }),
  remove: (id: string, instituicaoId: string) =>
    prisma.unidades_Escolares.deleteMany({ where: { id, instituicaoId } }),
};
