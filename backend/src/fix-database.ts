import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "🚨 INICIANDO LIMPEZA DE DADOS CORROMPIDOS (V2 - COM CASCADE MANUAL) 🚨\n"
  );

  const allUsers = await prisma.usuarios.findMany({ select: { id: true } });
  const validUserIds = new Set(allUsers.map((u) => u.id));
  console.log(`📚 Total de Usuários válidos no banco: ${allUsers.length}`);

  console.log("\n👉 Verificando Perfis de Alunos...");

  const alunos = await prisma.usuarios_aluno.findMany({
    select: { id: true, usuarioId: true },
  });

  let alunosDeletados = 0;

  for (const aluno of alunos) {
    if (!validUserIds.has(aluno.usuarioId)) {
      console.log(
        `   🗑️ REMOVENDO ALUNO CORROMPIDO: Perfil ID ${aluno.id} (Aponta para usuário fantasma ${aluno.usuarioId})`
      );

      const matriculasDoAluno = await prisma.matriculas.findMany({
        where: { alunoId: aluno.id },
        select: { id: true },
      });

      const matriculaIds = matriculasDoAluno.map((m) => m.id);

      if (matriculaIds.length > 0) {
        console.log(
          `      ↳ Limpando dependências de ${matriculaIds.length} matrículas...`
        );

        const mensalidades = await prisma.mensalidade.deleteMany({
          where: { matriculaId: { in: matriculaIds } },
        });
        if (mensalidades.count > 0)
          console.log(
            `         - ${mensalidades.count} mensalidades removidas.`
          );

        const avaliacoes = await prisma.avaliacaoParcial.deleteMany({
          where: { matriculaId: { in: matriculaIds } },
        });
        if (avaliacoes.count > 0)
          console.log(
            `         - ${avaliacoes.count} avaliações parciais removidas.`
          );

        const faltas = await prisma.registroFalta.deleteMany({
          where: { matriculaId: { in: matriculaIds } },
        });
        if (faltas.count > 0)
          console.log(`         - ${faltas.count} faltas removidas.`);

        const presencas = await prisma.diarioAulaPresenca.deleteMany({
          where: { matriculaId: { in: matriculaIds } },
        });
        if (presencas.count > 0)
          console.log(
            `         - ${presencas.count} presenças de diário removidas.`
          );

        const matriculasDeletadas = await prisma.matriculas.deleteMany({
          where: { id: { in: matriculaIds } },
        });
        console.log(
          `      ✅ ${matriculasDeletadas.count} matrículas removidas.`
        );
      }

      const submissoes = await prisma.submissoes.deleteMany({
        where: { alunoId: aluno.id },
      });
      if (submissoes.count > 0)
        console.log(`      - ${submissoes.count} submissões removidas.`);

      const conquistas = await prisma.conquistas_Usuarios.deleteMany({
        where: { alunoPerfilId: aluno.id },
      });
      if (conquistas.count > 0)
        console.log(`      - ${conquistas.count} conquistas removidas.`);

      const responsaveis = await prisma.responsavelAluno.deleteMany({
        where: { alunoId: aluno.id },
      });
      if (responsaveis.count > 0)
        console.log(
          `      - ${responsaveis.count} vínculos com responsáveis removidos.`
        );

      await prisma.usuarios_aluno.delete({ where: { id: aluno.id } });
      alunosDeletados++;
    }
  }

  if (alunosDeletados === 0)
    console.log("   ✅ Nenhum aluno corrompido encontrado.");
  else
    console.log(
      `   ⚠️ Total de perfis de alunos removidos: ${alunosDeletados}`
    );

  console.log("\n👉 Verificando Perfis de Professores...");
  const professores = await prisma.usuarios_professor.findMany({
    select: { id: true, usuarioId: true },
  });

  let profsDeletados = 0;
  for (const prof of professores) {
    if (!validUserIds.has(prof.usuarioId)) {
      const componentes = await prisma.componenteCurricular.count({
        where: { professorId: prof.id },
      });
      if (componentes > 0) {
        console.log(
          `   ⚠️ IGNORADO: Professor corrompido ID ${prof.id} possui ${componentes} componentes. Remova-os manualmente.`
        );
        continue;
      }

      console.log(`   🗑️ REMOVENDO PROFESSOR CORROMPIDO: ID ${prof.id}`);
      await prisma.diarioAula.deleteMany({ where: { professorId: prof.id } });
      await prisma.usuarios_professor.delete({ where: { id: prof.id } });
      profsDeletados++;
    }
  }
  if (profsDeletados === 0)
    console.log("   ✅ Nenhum professor corrompido removido.");

  console.log("\n👉 Verificando Perfis de Responsáveis...");
  const responsaveis = await prisma.usuarios_responsavel.findMany({
    select: { id: true, usuarioId: true },
  });
  let respsDeletados = 0;
  for (const resp of responsaveis) {
    if (!validUserIds.has(resp.usuarioId)) {
      console.log(`   🗑️ REMOVENDO RESPONSÁVEL CORROMPIDO: ID ${resp.id}`);
      await prisma.responsavelAluno.deleteMany({
        where: { responsavelId: resp.id },
      });
      await prisma.usuarios_responsavel.delete({ where: { id: resp.id } });
      respsDeletados++;
    }
  }
  if (respsDeletados === 0)
    console.log("   ✅ Nenhum responsável corrompido removido.");

  console.log("\n🏁 LIMPEZA CONCLUÍDA COM SUCESSO 🏁");
}

main()
  .catch((e) => {
    console.error("\n❌ Erro fatal durante a limpeza:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
