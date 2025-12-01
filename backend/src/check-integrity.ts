import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "🔍 Iniciando verificação global de integridade do banco de dados...\n"
  );

  console.log("Carregando lista de usuários válidos...");
  const allUsers = await prisma.usuarios.findMany({
    select: { id: true },
  });
  const validUserIds = new Set(allUsers.map((u) => u.id));
  console.log(`✅ Total de usuários no sistema: ${allUsers.length}\n`);

  console.log("👉 Verificando Perfis de ALUNOS...");
  const alunos = await prisma.usuarios_aluno.findMany({
    select: { id: true, usuarioId: true, numero_matricula: true },
  });

  let alunosOrfaos = 0;
  for (const aluno of alunos) {
    if (!validUserIds.has(aluno.usuarioId)) {
      console.error(
        `   ❌ [ERRO CRÍTICO] Perfil Aluno ID: ${aluno.id} (Matrícula: ${aluno.numero_matricula}) aponta para usuarioId ${aluno.usuarioId} que NÃO EXISTE.`
      );
      alunosOrfaos++;
    }
  }
  if (alunosOrfaos === 0) console.log("   ✅ Nenhum aluno órfão encontrado.");

  console.log("\n👉 Verificando Perfis de PROFESSORES...");
  const professores = await prisma.usuarios_professor.findMany({
    select: { id: true, usuarioId: true },
  });

  let profsOrfaos = 0;
  for (const prof of professores) {
    if (!validUserIds.has(prof.usuarioId)) {
      console.error(
        `   ❌ [ERRO CRÍTICO] Perfil Professor ID: ${prof.id} aponta para usuarioId ${prof.usuarioId} que NÃO EXISTE.`
      );
      profsOrfaos++;
    }
  }
  if (profsOrfaos === 0)
    console.log("   ✅ Nenhum professor órfão encontrado.");

  console.log("\n👉 Verificando Perfis de RESPONSÁVEIS...");
  const responsaveis = await prisma.usuarios_responsavel.findMany({
    select: { id: true, usuarioId: true },
  });

  let respsOrfaos = 0;
  for (const resp of responsaveis) {
    if (!validUserIds.has(resp.usuarioId)) {
      console.error(
        `   ❌ [ERRO CRÍTICO] Perfil Responsável ID: ${resp.id} aponta para usuarioId ${resp.usuarioId} que NÃO EXISTE.`
      );
      respsOrfaos++;
    }
  }
  if (respsOrfaos === 0)
    console.log("   ✅ Nenhum responsável órfão encontrado.");

  console.log("\n---------------------------------------------------");
  console.log(`RESUMO FINAL:`);
  console.log(`Alunos corrompidos: ${alunosOrfaos}`);
  console.log(`Professores corrompidos: ${profsOrfaos}`);
  console.log(`Responsáveis corrompidos: ${respsOrfaos}`);
  console.log("---------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("\n❌ Erro ao executar script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
