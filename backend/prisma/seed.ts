import { PrismaClient, PapelUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔥 Iniciando o script de seeding completo...");

  console.log("🗑️ Limpando dados antigos...");
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

  const instituicao = await prisma.instituicao.create({
    data: {
      nome: "Instituição Educacional Padrão",
      cidade: "Maceió",
    },
  });
  console.log(`[OK] Coleção "instituicoes" criada.`);

  const unidadeEscolar = await prisma.unidades_Escolares.create({
    data: {
      nome: "Unidade Central",
      endereco: "Rua Principal, 123",
      instituicaoId: instituicao.id,
    },
  });
  console.log(`[OK] Coleção "unidades_escolares" criada.`);

  const conquista = await prisma.conquistas.create({
    data: {
      instituicaoId: instituicao.id,
      codigo: "PRIMEIROS_PASSOS",
      titulo: "Primeiros Passos",
      descricao: "Completou a primeira tarefa.",
    },
  });
  console.log(`[OK] Coleção "conquistas" criada.`);

  const senhaHash = await bcrypt.hash("senha123", 10);
  const professor = await prisma.usuarios.create({
    data: {
      nome: "Prof. Ada Lovelace",
      email: "ada.lovelace@escola.com",
      senha_hash: senhaHash,
      papel: PapelUsuario.PROFESSOR,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeEscolar.id,
    },
  });
  const aluno = await prisma.usuarios.create({
    data: {
      nome: "Aluno Alan Turing",
      email: "alan.turing@escola.com",
      senha_hash: senhaHash,
      papel: PapelUsuario.ALUNO,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeEscolar.id,
    },
  });
  console.log(`[OK] Coleção "usuarios" criada.`);

  await prisma.conquistas_Usuarios.create({
    data: {
      conquistaId: conquista.id,
      usuarioId: aluno.id,
    },
  });
  console.log(`[OK] Coleção "conquistas_usuarios" criada.`);

  const turma = await prisma.turmas.create({
    data: {
      nome: "Turma 101 - Lógica de Programação",
      serie: "1º Ano",
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeEscolar.id,
      professorId: professor.id,
    },
  });
  console.log(`[OK] Coleção "turmas" criada.`);

  await prisma.matriculas.create({
    data: {
      alunoId: aluno.id,
      turmaId: turma.id,
    },
  });
  console.log(`[OK] Coleção "matriculas" criada.`);

  const topicoForum = await prisma.topico_Forum.create({
    data: {
      titulo: "Dúvida sobre a primeira aula",
      corpo: "Não entendi o conceito de variáveis, alguém pode ajudar?",
      instituicaoId: instituicao.id,
      usuarioId: aluno.id,
    },
  });
  console.log(`[OK] Coleção "topicos_forum" criada.`);

  await prisma.mensagens_Forum.create({
    data: {
      corpo:
        "Claro, Alan! Pense em uma variável como uma caixa onde você pode guardar um valor.",
      instituicaoId: instituicao.id,
      topicoId: topicoForum.id,
      usuarioId: professor.id,
    },
  });
  console.log(`[OK] Coleção "mensagens_forum" criada.`);

  await prisma.arquivos.create({
    data: {
      chave: "documento/apostila-aula-1.pdf",
      nome: "Apostila da Aula 1",
      tipo_conteudo: "application/pdf",
      tamanho: 1024,
      instituicaoId: instituicao.id,
      usuarioId: professor.id,
    },
  });
  console.log(`[OK] Coleção "arquivos" criada.`);

  const tarefa = await prisma.tarefas.create({
    data: {
      titulo: "Introdução a Algoritmos",
      descricao: "Resolver os problemas da lista 1.",
      pontos: 100,
      publicado: true,
      instituicaoId: instituicao.id,
      turmaId: turma.id,
      professorId: professor.id,
    },
  });
  console.log(`[OK] Coleção "tarefas" criada.`);

  const questao = await prisma.questoes.create({
    data: {
      sequencia: 1,
      tipo: "MULTIPLA_ESCOLHA",
      titulo: "Primeira Questão",
      enunciado: "Qual o valor de 2+2?",
      pontos: 20,
      payload: { dificuldade: "fácil" },
      tarefaId: tarefa.id,
      instituicaoId: instituicao.id,
    },
  });
  console.log(`[OK] Coleção "questoes" criada.`);

  await prisma.opcoes_Multipla_Escolha.create({
    data: {
      texto: "4",
      correta: true,
      sequencia: 1,
      questaoId: questao.id,
    },
  });
  await prisma.opcoes_Multipla_Escolha.create({
    data: {
      texto: "5",
      correta: false,
      sequencia: 2,
      questaoId: questao.id,
    },
  });
  console.log(`[OK] Coleção "opcoes_multipla_escolha" criada.`);

  const submissao = await prisma.submissoes.create({
    data: {
      status: "ENTREGUE",
      nota_total: 0,
      instituicaoId: instituicao.id,
      tarefaId: tarefa.id,
      alunoId: aluno.id,
    },
  });
  console.log(`[OK] Coleção "submissoes" criada.`);

  await prisma.respostas_Submissao.create({
    data: {
      resposta_texto: "A resposta é 4",
      nota: 0,
      questaoId: questao.id,
      submissaoId: submissao.id,
    },
  });
  console.log(`[OK] Coleção "respostas_submissao" criada.`);

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
