import { Prisma, PrismaClient, StatusMatricula } from "@prisma/client";
import {
  CreateMatriculaInput,
  FindAllMatriculasInput,
} from "./matricula.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

const fullInclude = {
  aluno: {
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
    },
  },
  turma: { select: { id: true, nome: true, serie: true } },
};

export async function create(
  data: CreateMatriculaInput,
  user: AuthenticatedRequest["user"]
) {
  const { unidadeEscolarId } = user;

  if (!unidadeEscolarId) {
    throw new Error("Usuário não vinculado a uma unidade escolar.");
  }

  const [aluno, turma] = await Promise.all([
    prisma.usuarios_aluno.findFirst({
      where: { id: data.alunoId, usuario: { unidadeEscolarId } },
    }),
    prisma.turmas.findFirst({ where: { id: data.turmaId, unidadeEscolarId } }),
  ]);

  if (!aluno || !turma) {
    throw new Error("Aluno ou turma não encontrada na sua unidade escolar.");
  }

  const matriculaExistente = await prisma.matriculas.findFirst({
    where: {
      alunoId: data.alunoId,
      ano_letivo: data.ano_letivo,
      status: "ATIVA",
    },
  });

  if (matriculaExistente) {
    throw new Error(
      "Este aluno já possui uma matrícula ativa para este ano letivo."
    );
  }

  return prisma.matriculas.create({
    data: {
      ...data,
      status: StatusMatricula.ATIVA,
    },
    include: fullInclude,
  });
}

export async function findAll(
  user: AuthenticatedRequest["user"],
  filters: FindAllMatriculasInput
) {
  console.log("\n--- [MATRICULA SERVICE] Iniciando busca de matrículas ---");
  console.log("USUÁRIO:", {
    id: user.id,
    papel: user.papel,
    unidadeEscolarId: user.unidadeEscolarId,
    perfilId: user.perfilId,
  });
  console.log("FILTROS RECEBIDOS:", filters);

  const where: Prisma.MatriculasWhereInput = {};

  if (user.papel === "GESTOR" || user.papel === "ADMINISTRADOR") {
    if (user.unidadeEscolarId) {
      console.log(
        `[LOGIC] Aplicando filtro de escola para Gestor/Admin: ${user.unidadeEscolarId}`
      );
      where.turma = { unidadeEscolarId: user.unidadeEscolarId };
    } else {
      console.warn(
        "[WARN] Gestor/Admin sem unidadeEscolarId. Buscando sem restrição de escola."
      );
    }
  }

  let turmaIdFilter = filters.turmaId;
  let professorValidadoPeloComponente = false;

  if (filters.componenteCurricularId) {
    console.log(
      `[LOGIC] Validando acesso via Componente: ${filters.componenteCurricularId}`
    );
    const componente = await prisma.componenteCurricular.findFirst({
      where: {
        id: filters.componenteCurricularId,
        ...(user.papel === "PROFESSOR" ? { professorId: user.perfilId! } : {}),
      },
      select: { turmaId: true, professorId: true },
    });

    if (!componente) {
      console.error(
        "[ERROR] Componente não encontrado ou professor sem permissão."
      );
      throw new Error(
        "Você não tem permissão para visualizar os alunos deste componente curricular."
      );
    }

    console.log(
      `[SUCCESS] Componente validado. Turma associada: ${componente.turmaId}`
    );
    turmaIdFilter = componente.turmaId;
    professorValidadoPeloComponente = user.papel === "PROFESSOR";
  }

  if (user.papel === "ALUNO") {
    where.aluno = { usuarioId: user.id };
  }

  if (user.papel === "PROFESSOR") {
    console.log("[LOGIC] Aplicando regras de PROFESSOR");

    if (turmaIdFilter) {
      if (!professorValidadoPeloComponente) {
        console.log(
          `[CHECK] Verificando se professor ${user.perfilId} tem acesso à turma ${turmaIdFilter}`
        );
        const temAcesso = await prisma.componenteCurricular.findFirst({
          where: {
            professorId: user.perfilId!,
            turmaId: turmaIdFilter,
          },
        });

        if (!temAcesso) {
          console.error("[ERROR] Professor não leciona nesta turma.");
          throw new Error(
            "Você não tem permissão para ver os alunos desta turma."
          );
        }
      }
      where.turmaId = turmaIdFilter;
    } else {
      console.log("[LOGIC] Buscando todas as turmas do professor.");
      const componentesDoProfessor = await prisma.componenteCurricular.findMany(
        {
          where: { professorId: user.perfilId! },
          select: { turmaId: true },
        }
      );

      const turmasIds = [
        ...new Set(
          componentesDoProfessor
            .map((c) => c.turmaId)
            .filter((turmaId): turmaId is string => Boolean(turmaId))
        ),
      ];

      console.log(`[INFO] Professor possui acesso às turmas: ${turmasIds}`);

      if (turmasIds.length === 0) {
        console.warn("[WARN] Professor não possui nenhuma turma vinculada.");
        return [];
      }

      where.turmaId = { in: turmasIds };
    }
  } else {
    if (turmaIdFilter) {
      where.turmaId = turmaIdFilter;
    }
  }

  if (filters.ano_letivo) {
    where.ano_letivo = Number(filters.ano_letivo);
  }

  if (filters.status) {
    where.status = filters.status;
  }

  console.log("CLAUSULA WHERE FINAL:", JSON.stringify(where, null, 2));

  const result = await prisma.matriculas.findMany({
    where,
    include: fullInclude,
    orderBy: {
      aluno: {
        usuario: {
          nome: "asc",
        },
      },
    },
  });

  console.log(
    `--- [MATRICULA SERVICE] Encontradas ${result.length} matrículas ---\n`
  );
  return result;
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  const where: Prisma.MatriculasWhereInput = { id };

  if (user.unidadeEscolarId && user.papel !== "PROFESSOR") {
    where.turma = { unidadeEscolarId: user.unidadeEscolarId };
  }

  return prisma.matriculas.findFirst({
    where,
    include: fullInclude,
  });
}

export async function updateStatus(
  id: string,
  status: StatusMatricula,
  user: AuthenticatedRequest["user"]
) {
  const matricula = await findById(id, user);
  if (!matricula) {
    const error = new Error("Matrícula não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }

  return prisma.matriculas.update({
    where: { id },
    data: { status },
    include: fullInclude,
  });
}

export async function remove(id: string, user: AuthenticatedRequest["user"]) {
  const matricula = await findById(id, user);
  if (!matricula) {
    const error = new Error("Matrícula não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }

  return prisma.matriculas.delete({ where: { id } });
}

export const matriculaService = {
  create,
  findAll,
  findById,
  updateStatus,
  remove,
};
