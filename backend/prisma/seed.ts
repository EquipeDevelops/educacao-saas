import { PrismaClient, PapelUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔥 Iniciando o script de seeding completo...");

  console.log("🗑️  Limpando dados antigos...");
  await prisma.respostas_Submissao.deleteMany({});
  await prisma.opcoes_Multipla_Escolha.deleteMany({});
  await prisma.submissoes.deleteMany({});
  await prisma.questoes.deleteMany({});
  await prisma.tarefas.deleteMany({});
  await prisma.mensagens_Forum.deleteMany({});
  await prisma.topico_Forum.deleteMany({});
  await prisma.arquivos.deleteMany({});
  await prisma.conquistas_Usuarios.deleteMany({});
  await prisma.conquistas.deleteMany({});
  await prisma.matriculas.deleteMany({});
  await prisma.turmas.deleteMany({});
  await prisma.usuarios.deleteMany({});
  await prisma.unidades_Escolares.deleteMany({});
  await prisma.instituicao.deleteMany({});
  console.log("🧹 Dados antigos limpos.");

  console.log("🏗️  Criando dados base...");

  const instituicao = await prisma.instituicao.create({
    data: {
      nome: "Instituição Educacional Padrão",
      cidade: "Maceió",
      metadados: { fundacao: 2025 },
    },
  });
  console.log(`[OK] Instituição criada: ${instituicao.nome}`);

  const unidadeEscolar = await prisma.unidades_Escolares.create({
    data: {
      nome: "Unidade Central",
      endereco: "Rua Principal, 123",
      instituicaoId: instituicao.id,
    },
  });
  console.log(`[OK] Unidade Escolar criada: ${unidadeEscolar.nome}`);

  console.log("🏆 Criando Conquistas e Usuários...");

  await prisma.conquistas.createMany({
    data: [
      {
        instituicaoId: instituicao.id,
        codigo: "PRIMEIRA_TAREFA",
        titulo: "Primeiros Passos",
        descricao: "Completou a primeira tarefa com sucesso.",
      },
      {
        instituicaoId: instituicao.id,
        codigo: "FORUM_PRO",
        titulo: "Membro Ativo",
        descricao: "Participou de um tópico no fórum.",
      },
    ],
  });
  console.log(`[OK] Catálogo de Conquistas criado.`);

  const senhaHash = await bcrypt.hash("senha123", 10);

  const admin = await prisma.usuarios.create({
    data: {
      nome: "Admin do Sistema",
      email: "admin@sistema.com",
      senha_hash: senhaHash,
      papel: PapelUsuario.ADMINISTRADOR,
      instituicaoId: instituicao.id,
    },
  });

  const profAda = await prisma.usuarios.create({
    data: {
      nome: "Prof. Ada Lovelace",
      email: "ada.lovelace@escola.com",
      senha_hash: senhaHash,
      papel: PapelUsuario.PROFESSOR,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeEscolar.id,
    },
  });

  const alunoAlan = await prisma.usuarios.create({
    data: {
      nome: "Aluno Alan Turing",
      email: "alan.turing@escola.com",
      senha_hash: senhaHash,
      papel: PapelUsuario.ALUNO,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeEscolar.id,
    },
  });

  const alunaGrace = await prisma.usuarios.create({
    data: {
      nome: "Aluna Grace Hopper",
      email: "grace.hopper@escola.com",
      senha_hash: senhaHash,
      papel: PapelUsuario.ALUNO,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeEscolar.id,
    },
  });
  console.log(
    `[OK] Usuários criados: ${admin.nome}, ${profAda.nome}, ${alunoAlan.nome}, ${alunaGrace.nome}`
  );

  console.log("📚 Criando Turmas e Matrículas...");

  const turmaLogica = await prisma.turmas.create({
    data: {
      nome: "Turma 101 - Lógica de Programação",
      serie: "1º Ano",
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeEscolar.id,
      professorId: profAda.id,
    },
  });
  console.log(`[OK] Turma criada: ${turmaLogica.nome}`);

  await prisma.matriculas.createMany({
    data: [
      { alunoId: alunoAlan.id, turmaId: turmaLogica.id },
      { alunoId: alunaGrace.id, turmaId: turmaLogica.id },
    ],
  });
  console.log(`[OK] Matrículas realizadas para a turma ${turmaLogica.nome}.`);

  console.log("💬 Criando interações (Fórum, Arquivos)...");

  const topicoForum = await prisma.topico_Forum.create({
    data: {
      titulo: "Dúvida sobre a primeira aula",
      corpo: "Não entendi o conceito de variáveis, alguém pode ajudar?",
      instituicaoId: instituicao.id,
      usuarioId: alunoAlan.id,
    },
  });

  await prisma.mensagens_Forum.create({
    data: {
      corpo:
        "Claro, Alan! Pense em uma variável como uma caixa onde você pode guardar um valor para usar depois.",
      instituicaoId: instituicao.id,
      topicoId: topicoForum.id,
      usuarioId: profAda.id,
    },
  });
  console.log(`[OK] Tópico do Fórum criado: "${topicoForum.titulo}"`);

  await prisma.arquivos.create({
    data: {
      chave: "documentos/apostila-aula-1.pdf",
      nome: "Apostila da Aula 1 - Lógica.pdf",
      tipo_conteudo: "application/pdf",
      tamanho: 1024 * 500,
      instituicaoId: instituicao.id,
      usuarioId: profAda.id,
    },
  });
  console.log(`[OK] Arquivo de exemplo criado.`);

  console.log("📝 Criando conteúdo acadêmico...");

  const tarefa = await prisma.tarefas.create({
    data: {
      titulo: "Introdução a Algoritmos",
      descricao:
        "Resolver os problemas da lista 1 sobre variáveis e condicionais.",
      pontos: 100,
      publicado: true,
      instituicaoId: instituicao.id,
      turmaId: turmaLogica.id,
      professorId: profAda.id,
    },
  });
  console.log(`[OK] Tarefa criada: "${tarefa.titulo}"`);

  const questao1 = await prisma.questoes.create({
    data: {
      sequencia: 1,
      tipo: "MULTIPLA_ESCOLHA",
      titulo: "Questão 1 - Soma",
      enunciado: "Qual o resultado da operação 5 + 3?",
      pontos: 50,
      payload: { dificuldade: "fácil" },
      tarefaId: tarefa.id,
      instituicaoId: instituicao.id,
    },
  });

  const questao2 = await prisma.questoes.create({
    data: {
      sequencia: 2,
      tipo: "DISSERTATIVA",
      titulo: "Questão 2 - Explicação",
      enunciado:
        "Com suas palavras, explique o que é uma estrutura condicional 'if/else'.",
      pontos: 50,
      payload: { min_caracteres: 50 },
      tarefaId: tarefa.id,
      instituicaoId: instituicao.id,
    },
  });
  console.log(`[OK] Questões criadas para a tarefa.`);

  await prisma.opcoes_Multipla_Escolha.createMany({
    data: [
      { texto: "7", correta: false, sequencia: 1, questaoId: questao1.id },
      { texto: "8", correta: true, sequencia: 2, questaoId: questao1.id },
      { texto: "9", correta: false, sequencia: 3, questaoId: questao1.id },
    ],
  });
  console.log(`[OK] Opções de múltipla escolha criadas.`);

  console.log("📤 Criando Submissões e premiando usuários...");

  const submissaoAlan = await prisma.submissoes.create({
    data: {
      status: "ENTREGUE",
      nota_total: 0,
      instituicaoId: instituicao.id,
      tarefaId: tarefa.id,
      alunoId: alunoAlan.id,
    },
  });

  await prisma.respostas_Submissao.createMany({
    data: [
      {
        resposta_texto: "8",
        nota: 0,
        questaoId: questao1.id,
        submissaoId: submissaoAlan.id,
      },
      {
        resposta_texto:
          "Uma estrutura if/else permite que o programa tome decisões e execute blocos de código diferentes baseado em uma condição ser verdadeira ou falsa.",
        nota: 0,
        questaoId: questao2.id,
        submissaoId: submissaoAlan.id,
      },
    ],
  });
  console.log(
    `[OK] Submissão e respostas criadas para o aluno ${alunoAlan.nome}.`
  );

  const primeiraTarefaConquista = await prisma.conquistas.findUnique({
    where: { codigo: "PRIMEIRA_TAREFA" },
  });
  if (primeiraTarefaConquista) {
    await prisma.conquistas_Usuarios.create({
      data: {
        conquistaId: primeiraTarefaConquista.id,
        usuarioId: alunoAlan.id,
        metadados: { tarefaId: tarefa.id },
      },
    });
    console.log(
      `[OK] Conquista "Primeiros Passos" concedida a ${alunoAlan.nome}.`
    );
  }

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
