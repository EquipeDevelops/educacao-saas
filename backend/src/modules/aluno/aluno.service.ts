import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const findAllPerfis = (unidadeEscolarId: string) => {
  console.log(
    "[SERVICE] Buscando todos os perfis de alunos para a unidade:",
    unidadeEscolarId
  );
  return prisma.usuarios_aluno.findMany({
    where: { usuario: { unidadeEscolarId: unidadeEscolarId, status: true } },
    select: {
      id: true,
      numero_matricula: true,
      usuario: { select: { id: true, nome: true } },
    },
    orderBy: { usuario: { nome: "asc" } },
  });
};

const findOneByUserId = async (usuarioId: string) => {
  return prisma.usuarios_aluno.findFirst({
    where: { usuarioId: usuarioId },
    select: {
      id: true,
      usuario: { select: { id: true, nome: true, email: true } },
      matriculas: {
        where: { status: "ATIVA" },
        select: { id: true },
        take: 1,
      },
    },
  });
};
async function getBoletim(usuarioId: string) {
  console.log(
    `\n--- [BOLETIM SERVICE] Iniciando para o usuário ID: ${usuarioId} ---`
  );

  const perfilAluno = await prisma.usuarios_aluno.findUnique({
    where: { usuarioId },
    select: { id: true },
  });

  if (!perfilAluno) {
    console.error(
      `[BOLETIM SERVICE] ERRO: Perfil de aluno não encontrado para o usuário ID: ${usuarioId}`
    );
    throw new Error("Perfil de aluno não encontrado para este usuário.");
  }
  const alunoPerfilId = perfilAluno.id;
  console.log(
    `[BOLETIM SERVICE] Perfil de aluno encontrado. ID do Perfil: ${alunoPerfilId}`
  );

  const [avaliacoes, submissoes] = await Promise.all([
    prisma.avaliacaoParcial.findMany({
      where: { matricula: { alunoId: alunoPerfilId, status: "ATIVA" } },
      select: {
        nota: true,
        periodo: true,
        tipo: true,
        componenteCurricular: {
          select: { materia: { select: { nome: true } } },
        },
      },
    }),
    prisma.submissoes.findMany({
      where: {
        alunoId: alunoPerfilId,
        status: "AVALIADA",
        nota_total: { not: null },
      },
      select: {
        nota_total: true,
        tarefa: {
          select: {
            tipo: true,
            componenteCurricular: {
              select: { materia: { select: { nome: true } } },
            },
          },
        },
      },
    }),
  ]);
  console.log(
    `[BOLETIM SERVICE] Encontradas ${avaliacoes.length} avaliações parciais e ${submissoes.length} submissões.`
  );

  const todasAsNotas: {
    materia: string;
    periodo: string;
    tipo: string;
    nota: number;
  }[] = [];

  avaliacoes.forEach((av) => {
    if (av.componenteCurricular?.materia?.nome) {
      todasAsNotas.push({
        materia: av.componenteCurricular.materia.nome,
        periodo: av.periodo,
        tipo: String(av.tipo),
        nota: av.nota,
      });
    } else {
      console.warn(
        "[BOLETIM SERVICE] Aviso: Ignorando avaliação parcial sem matéria associada."
      );
    }
  });

  submissoes.forEach((sub) => {
    if (sub.tarefa?.componenteCurricular?.materia?.nome) {
      todasAsNotas.push({
        materia: sub.tarefa.componenteCurricular.materia.nome,
        periodo: "ATIVIDADES_CONTINUAS",
        tipo: String(sub.tarefa.tipo),
        nota: sub.nota_total!,
      });
    } else {
      console.warn(
        "[BOLETIM SERVICE] Aviso: Ignorando submissão sem matéria associada."
      );
    }
  });
  console.log(
    `[BOLETIM SERVICE] Total de notas válidas processadas: ${todasAsNotas.length}`
  );

  const boletimFinal = todasAsNotas.reduce((acc: Record<string, any>, nota) => {
    if (!acc[nota.materia]) acc[nota.materia] = {};
    if (!acc[nota.materia][nota.periodo]) {
      acc[nota.materia][nota.periodo] = { avaliacoes: [], media: 0 };
    }
    acc[nota.materia][nota.periodo].avaliacoes.push({
      tipo: nota.tipo,
      nota: nota.nota,
    });
    return acc;
  }, {});

  for (const materia in boletimFinal) {
    let notasDaMateria: number[] = [];
    for (const periodo in boletimFinal[materia]) {
      const notasDoPeriodo = boletimFinal[materia][periodo].avaliacoes.map(
        (av: any) => av.nota
      );
      notasDaMateria.push(...notasDoPeriodo);
      if (notasDoPeriodo.length > 0) {
        const mediaPeriodo =
          notasDoPeriodo.reduce((a: number, b: number) => a + b, 0) /
          notasDoPeriodo.length;
        boletimFinal[materia][periodo].media = parseFloat(
          mediaPeriodo.toFixed(2)
        );
      }
    }
    if (notasDaMateria.length > 0) {
      const mediaFinalMateria =
        notasDaMateria.reduce((a, b) => a + b, 0) / notasDaMateria.length;
      boletimFinal[materia].mediaFinalGeral = parseFloat(
        mediaFinalMateria.toFixed(2)
      );
    } else {
      boletimFinal[materia].mediaFinalGeral = 0;
    }
  }

  console.log(
    "[BOLETIM SERVICE] Boletim finalizado e pronto para ser enviado."
  );
  return boletimFinal;
}

export const alunoService = {
  findAllPerfis,
  findOne: findOneByUserId,
  getBoletim,
};
