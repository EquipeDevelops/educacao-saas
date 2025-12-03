import { Prisma, PrismaClient, PapelUsuario } from "@prisma/client";
import bcryptjs from "bcryptjs";
import { CreateUserInput } from "./usuario.validator";
import { Readable } from "stream";
import csv from "csv-parser";

const prisma = new PrismaClient();

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface UserPayload {
  id: string;
  instituicaoId: string | null;
  unidadeEscolarId: string | null;
  papel: PapelUsuario;
}

interface UserCreationData extends CreateUserInput {
  instituicaoId: string;
  unidadeEscolarId: string;
  fotoUrl?: string | null;
  data?: any;
}

interface AlunoCSV {
  nome: string;
  email: string;
  data_nascimento: string;
  numero_matricula: string;
  email_responsavel?: string;
}

async function importarAlunos(
  user: UserPayload,
  fileBuffer: Buffer,
  prismaClient: PrismaTransactionClient = prisma
): Promise<{ criados: number; erros: number; detalhesErros: string[] }> {
  if (!user.unidadeEscolarId || !user.instituicaoId) {
    throw new Error(
      "Gestor não está vinculado a uma instituição ou unidade escolar."
    );
  }

  const resultados = await new Promise<AlunoCSV[]>((resolve, reject) => {
    const stream = Readable.from(fileBuffer);
    const data: AlunoCSV[] = [];
    stream
      .pipe(csv())
      .on("data", (row) => data.push(row))
      .on("end", () => resolve(data))
      .on("error", (error) => reject(error));
  });

  let criados = 0;
  let erros = 0;
  const detalhesErros: string[] = [];
  const senhaPadrao = "mudar123";
  const senhaHash = await bcryptjs.hash(senhaPadrao, 10);

  for (const [index, aluno] of resultados.entries()) {
    const linha = index + 2;
    if (
      !aluno.nome ||
      !aluno.email ||
      !aluno.numero_matricula ||
      !aluno.data_nascimento
    ) {
      erros++;
      detalhesErros.push(
        `Linha ${linha}: Faltam dados obrigatórios (nome, email, numero_matricula, data_nascimento).`
      );
      continue;
    }
    try {
      const emailExistente = await prismaClient.usuarios.findUnique({
        where: { email: aluno.email },
      });
      const matriculaExistente = await prismaClient.usuarios_aluno.findUnique({
        where: { numero_matricula: aluno.numero_matricula },
      });
      if (emailExistente) {
        erros++;
        detalhesErros.push(
          `Linha ${linha}: O email '${aluno.email}' já está em uso.`
        );
        continue;
      }
      if (matriculaExistente) {
        erros++;
        detalhesErros.push(
          `Linha ${linha}: O número de matrícula '${aluno.numero_matricula}' já está em uso.`
        );
        continue;
      }
      await prismaClient.$transaction(async (tx) => {
        const novoUsuario = await tx.usuarios.create({
          data: {
            nome: aluno.nome,
            email: aluno.email,
            senha_hash: senhaHash,
            papel: PapelUsuario.ALUNO,
            status: true,
            data_nascimento: new Date(aluno.data_nascimento),
            unidadeEscolarId: user.unidadeEscolarId,
            instituicaoId: user.instituicaoId,
          },
        });
        await tx.usuarios_aluno.create({
          data: {
            usuarioId: novoUsuario.id,
            numero_matricula: aluno.numero_matricula,
            email_responsavel: aluno.email_responsavel || null,
          },
        });
      });
      criados++;
    } catch (error) {
      erros++;
      detalhesErros.push(
        `Linha ${linha}: Erro ao processar o aluno '${aluno.nome}'. Verifique os dados.`
      );
    }
  }
  return { criados, erros, detalhesErros };
}

async function createUser(
  input: UserCreationData,
  prismaClient: PrismaTransactionClient = prisma
) {
  const {
    nome,
    email,
    senha,
    papel,
    perfil_aluno,
    perfil_professor,
    perfil_responsavel,
    instituicaoId,
    unidadeEscolarId,
    fotoUrl,
    data: ignoredFormData,
  } = input;

  const senhaHash = await bcryptjs.hash(senha, 10);

  const novoUsuario = await prismaClient.usuarios.create({
    data: {
      nome,
      email,
      senha_hash: senhaHash,
      papel,
      status: true,
      instituicaoId,
      unidadeEscolarId,
      fotoUrl,
    },
  });

  if (papel === PapelUsuario.ALUNO && perfil_aluno) {
    await prismaClient.usuarios_aluno.create({
      data: { usuarioId: novoUsuario.id, ...perfil_aluno },
    });
  } else if (papel === PapelUsuario.PROFESSOR && perfil_professor) {
    await prismaClient.usuarios_professor.create({
      data: { usuarioId: novoUsuario.id, ...perfil_professor },
    });
  } else if (papel === PapelUsuario.RESPONSAVEL && perfil_responsavel) {
    await prismaClient.usuarios_responsavel.create({
      data: {
        usuarioId: novoUsuario.id,
        telefone: perfil_responsavel.telefone || null,
        alunos:
          perfil_responsavel.alunos && perfil_responsavel.alunos.length > 0
            ? {
                create: perfil_responsavel.alunos.map((aluno) => ({
                  aluno: { connect: { id: aluno.alunoId } },
                  parentesco: aluno.parentesco || null,
                  principal: aluno.principal ?? false,
                })),
              }
            : undefined,
      },
    });
  }

  const usuarioCompleto = await prismaClient.usuarios.findUniqueOrThrow({
    where: { id: novoUsuario.id },
    include: {
      perfil_aluno: true,
      perfil_professor: true,
      perfil_responsavel: { include: { alunos: true } },
    },
  });

  const { senha_hash, ...usuarioSemSenha } = usuarioCompleto;
  return usuarioSemSenha;
}

async function findAllUsers(where: Prisma.UsuariosWhereInput) {
  return prisma.usuarios.findMany({
    where,
    select: {
      id: true,
      nome: true,
      email: true,
      papel: true,
      status: true,
      fotoUrl: true,
    },
    orderBy: { nome: "asc" },
  });
}

async function findUserById(id: string, where: Prisma.UsuariosWhereInput) {
  const usuario = await prisma.usuarios.findFirst({
    where: { id, ...where },
    include: {
      perfil_aluno: true,
      perfil_professor: true,
      perfil_responsavel: { include: { alunos: true } },
    },
  });
  if (!usuario) return null;
  const { senha_hash, ...usuarioSemSenha } = usuario;
  return usuarioSemSenha;
}

async function updateUser(
  id: string,
  input: Prisma.UsuariosUpdateInput & {
    perfil_professor?: { titulacao?: string; area_especializacao?: string };
    fotoUrl?: string;
    data?: any;
  },
  where: Prisma.UsuariosWhereInput,
  prismaClient: PrismaTransactionClient = prisma
) {
  const userExists = await prismaClient.usuarios.findFirst({
    where: { id, ...where },
    select: { perfil_professor: { select: { id: true } } },
  });

  if (!userExists) {
    throw new Error("Usuário não encontrado ou sem permissão para atualizar.");
  }

  const { perfil_professor, data: ignoredFormData, ...userData } = input;

  return prismaClient.$transaction(async (tx) => {
    await tx.usuarios.update({ where: { id }, data: userData });

    if (perfil_professor && userExists.perfil_professor) {
      await tx.usuarios_professor.update({
        where: { id: userExists.perfil_professor.id },
        data: perfil_professor,
      });
    }

    const finalUser = await tx.usuarios.findUniqueOrThrow({
      where: { id },
      include: { perfil_aluno: true, perfil_professor: true },
    });

    const { senha_hash, ...usuarioSemSenha } = finalUser;
    return usuarioSemSenha;
  });
}

async function deleteUser(
  id: string,
  where: Prisma.UsuariosWhereInput,
  prismaClient: PrismaTransactionClient = prisma
) {
  const userExists = await prismaClient.usuarios.findFirst({
    where: { id, ...where },
  });
  if (!userExists)
    throw new Error("Usuário não encontrado ou sem permissão para deletar.");
  await prismaClient.usuarios.delete({ where: { id } });
  return { message: "Usuário deletado com sucesso." };
}

export const usuarioService = {
  createUser,
  findAllUsers,
  findUserById,
  updateUser,
  deleteUser,
  importarAlunos,
};