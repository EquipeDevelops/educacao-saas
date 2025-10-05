import {
  PrismaClient,
  PapelUsuario,
  Turno,
  StatusMatricula,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "🔥 Iniciando o script de seeding com a HIERARQUIA CORRETA E COMPLETA..."
  );

  console.log("🗑️  Limpando todos os dados antigos na ordem correta...");
  await prisma.matriculas.deleteMany({});
  await prisma.componenteCurricular.deleteMany({});
  await prisma.turmas.deleteMany({});
  await prisma.materias.deleteMany({});
  await prisma.conquistasPorUnidade.deleteMany({});
  await prisma.conquistas_Usuarios.deleteMany({});
  await prisma.conquistas.deleteMany({});
  await prisma.usuarios_aluno.deleteMany({});
  await prisma.usuarios_professor.deleteMany({});
  await prisma.usuarios.deleteMany({});
  await prisma.unidades_Escolares.deleteMany({});
  await prisma.instituicao.deleteMany({});
  console.log("🧹 Dados antigos limpos.");

  console.log("👑 Criando Super Admin e Instituição...");
  const senhaHash = await bcrypt.hash("senha123", 10);

  await prisma.usuarios.create({
    data: {
      nome: "Super Admin Global",
      email: "super@admin.com",
      senha_hash: senhaHash,
      papel: PapelUsuario.ADMINISTRADOR,
      instituicaoId: undefined,
    },
  });

  const instituicao = await prisma.instituicao.create({
    data: {
      nome: "Grupo Educacional Prisma",
      cidade: "Maceió",
      estado: "AL",
      cep: "57000-000",
    },
  });
  console.log(`[OK] Instituição: ${instituicao.nome}`);

  console.log("🏢 Criando Admin da Instituição...");
  const adminInstituicao = await prisma.usuarios.create({
    data: {
      nome: "Admin do Grupo Prisma",
      email: "admin@prisma.edu",
      senha_hash: senhaHash,
      papel: PapelUsuario.ADMINISTRADOR,
      instituicaoId: instituicao.id,
    },
  });
  console.log(`[OK] Admin da Instituição: ${adminInstituicao.nome}`);

  console.log("🏫 Criando Colégios e seus Gestores...");

  const unidadeTech = await prisma.unidades_Escolares.create({
    data: {
      nome: "Colégio Prisma Tech",
      cidade: "Maceió",
      estado: "AL",
      cep: "57010-001",
      instituicaoId: instituicao.id,
    },
  });
  const gestorTech = await prisma.usuarios.create({
    data: {
      nome: "Gestora Maria Tech",
      email: "gestor.tech@prisma.edu",
      senha_hash: senhaHash,
      papel: PapelUsuario.GESTOR,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeTech.id,
    },
  });
  console.log(
    `[OK] Colégio '${unidadeTech.nome}' e Gestora '${gestorTech.nome}' criados.`
  );

  const unidadeHumanas = await prisma.unidades_Escolares.create({
    data: {
      nome: "Colégio Prisma Humanas",
      cidade: "Maceió",
      estado: "AL",
      cep: "57020-002",
      instituicaoId: instituicao.id,
    },
  });
  const gestorHumanas = await prisma.usuarios.create({
    data: {
      nome: "Gestor João Humanas",
      email: "gestor.humanas@prisma.edu",
      senha_hash: senhaHash,
      papel: PapelUsuario.GESTOR,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeHumanas.id,
    },
  });
  console.log(
    `[OK] Colégio '${unidadeHumanas.nome}' e Gestor '${gestorHumanas.nome}' criados.`
  );

  console.log(`🧑‍🏫 Populando o '${unidadeTech.nome}'...`);

  const profAda = await prisma.usuarios.create({
    data: {
      nome: "Prof. Ada Lovelace",
      email: "ada.lovelace@prisma.edu",
      senha_hash: senhaHash,
      papel: PapelUsuario.PROFESSOR,
      instituicaoId: instituicao.id,
      perfil_professor: {
        create: {
          titulacao: "Doutora",
        },
      },
    },
  });
  const perfilProfAda = await prisma.usuarios_professor.findUniqueOrThrow({
    where: { usuarioId: profAda.id },
  });

  const alunoAlan = await prisma.usuarios.create({
    data: {
      nome: "Aluno Alan Turing",
      email: "alan.turing@prisma.edu",
      senha_hash: senhaHash,
      papel: PapelUsuario.ALUNO,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeTech.id,
      perfil_aluno: {
        create: {
          numero_matricula: `MAT-TECH-${Math.floor(Math.random() * 10000)}`,
        },
      },
    },
  });
  const perfilAlunoAlan = await prisma.usuarios_aluno.findUniqueOrThrow({
    where: { usuarioId: alunoAlan.id },
  });

  const materiaLP = await prisma.materias.create({
    data: {
      nome: "Lógica de Programação",
      codigo: "TEC101",
      unidadeEscolarId: unidadeTech.id,
    },
  });

  const turmaT101 = await prisma.turmas.create({
    data: {
      nome: "T-101",
      serie: "1º Período",
      turno: Turno.MATUTINO,
      unidadeEscolarId: unidadeTech.id,
    },
  });

  await prisma.componenteCurricular.create({
    data: {
      ano_letivo: new Date().getFullYear(),
      turmaId: turmaT101.id,
      materiaId: materiaLP.id,
      professorId: perfilProfAda.id,
    },
  });

  await prisma.matriculas.create({
    data: {
      alunoId: perfilAlunoAlan.id,
      turmaId: turmaT101.id,
      ano_letivo: new Date().getFullYear(),
      status: StatusMatricula.ATIVA,
    },
  });
  console.log(
    `[OK] '${unidadeTech.nome}' populado com 1 professor, 1 aluno, 1 matéria, 1 turma e 1 matrícula.`
  );
  console.log("✅ Seeding completo finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Ocorreu um erro durante o seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
