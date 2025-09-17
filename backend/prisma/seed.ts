import {
  PrismaClient,
  PapelUsuario,
  Turno,
  TipoTarefa,
  TipoQuestao,
  StatusSubmissao,
  DiaDaSemana,
  StatusMatricula,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔥 Iniciando o script de seeding completo...");

  console.log("🗑️  Limpando dados antigos...");
  await prisma.comentarioTarefa.deleteMany({});
  await prisma.horarioAula.deleteMany({});
  await prisma.mensagem.deleteMany({});
  await prisma.participante.deleteMany({});
  await prisma.conversa.deleteMany({});
  await prisma.respostas_Submissao.deleteMany({});
  await prisma.opcoes_Multipla_Escolha.deleteMany({});
  await prisma.submissoes.deleteMany({});
  await prisma.questoes.deleteMany({});
  await prisma.tarefas.deleteMany({});
  await prisma.registroFalta.deleteMany({});
  await prisma.avaliacaoParcial.deleteMany({});
  await prisma.componenteCurricular.deleteMany({});
  await prisma.materias.deleteMany({});
  await prisma.mensagens_Forum.deleteMany({});
  await prisma.topico_Forum.deleteMany({});
  await prisma.arquivos.deleteMany({});
  await prisma.conquistas_Usuarios.deleteMany({});
  await prisma.conquistas.deleteMany({});
  await prisma.matriculas.deleteMany({});
  await prisma.turmas.deleteMany({});
  await prisma.usuarios_aluno.deleteMany({});
  await prisma.usuarios_professor.deleteMany({});
  await prisma.usuarios.deleteMany({});
  await prisma.unidades_Escolares.deleteMany({});
  await prisma.instituicao.deleteMany({});
  console.log("🧹 Dados antigos limpos.");

  console.log("🏗️  Criando dados base...");

  const instituicao = await prisma.instituicao.create({
    data: {
      nome: "Academia Digital Prisma",
      cidade: "Maceió",
      estado: "AL",
      cep: "57000-000",
      metadados: { fundacao: 2025 },
    },
  });
  console.log(`[OK] Instituição criada: ${instituicao.nome}`);

  const unidadeEscolar = await prisma.unidades_Escolares.create({
    data: {
      nome: "Unidade Central Tech",
      cidade: "Maceió",
      estado: "AL",
      cep: "57000-001",
      instituicaoId: instituicao.id,
    },
  });
  console.log(`[OK] Unidade Escolar criada: ${unidadeEscolar.nome}`);

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
        codigo: "DEBATEDOR",
        titulo: "Debatedor Nato",
        descricao: "Iniciou uma conversa no chat.",
      },
    ],
  });
  console.log(`[OK] Catálogo de Conquistas criado.`);

  console.log("👤 Criando Usuários e Perfis...");
  const senhaHash = await bcrypt.hash("senha123", 10);

  const superAdmin = await prisma.usuarios.create({
    data: {
      nome: "Super Admin",
      email: "super@admin.com",
      senha_hash: senhaHash,
      papel: PapelUsuario.ADMINISTRADOR,
      status: true,
      instituicaoId: undefined,
    },
  });

  const admin = await prisma.usuarios.create({
    data: {
      nome: "Admin da Academia",
      email: "admin@prisma.edu",
      senha_hash: senhaHash,
      papel: PapelUsuario.ADMINISTRADOR,
      status: true,
      instituicaoId: instituicao.id,
    },
  });

  const profAda = await prisma.usuarios.create({
    data: {
      nome: "Prof. Ada Lovelace",
      email: "ada.lovelace@prisma.edu",
      senha_hash: senhaHash,
      papel: PapelUsuario.PROFESSOR,
      status: true,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeEscolar.id,
    },
  });
  const perfilProfAda = await prisma.usuarios_professor.create({
    data: {
      usuarioId: profAda.id,
      titulacao: "Doutora",
      area_especializacao: "Ciência da Computação",
    },
  });

  const alunoAlan = await prisma.usuarios.create({
    data: {
      nome: "Aluno Alan Turing",
      email: "alan.turing@prisma.edu",
      senha_hash: senhaHash,
      papel: PapelUsuario.ALUNO,
      status: true,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeEscolar.id,
    },
  });
  const perfilAlunoAlan = await prisma.usuarios_aluno.create({
    data: {
      usuarioId: alunoAlan.id,
      numero_matricula: `MAT-${Math.floor(Math.random() * 10000)}`,
    },
  });

  const alunaGrace = await prisma.usuarios.create({
    data: {
      nome: "Aluna Grace Hopper",
      email: "grace.hopper@prisma.edu",
      senha_hash: senhaHash,
      papel: PapelUsuario.ALUNO,
      status: true,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeEscolar.id,
    },
  });
  const perfilAlunaGrace = await prisma.usuarios_aluno.create({
    data: {
      usuarioId: alunaGrace.id,
      numero_matricula: `MAT-${Math.floor(Math.random() * 10000)}`,
    },
  });
  console.log(`[OK] Usuários e perfis criados.`);

  console.log("📚 Criando Estrutura Acadêmica...");
  const materiaLP = await prisma.materias.create({
    data: {
      nome: "Lógica de Programação",
      instituicaoId: instituicao.id,
    },
  });

  const turmaT101 = await prisma.turmas.create({
    data: {
      nome: "T-101",
      serie: "1º Período",
      turno: Turno.MATUTINO,
      instituicaoId: instituicao.id,
      unidadeEscolarId: unidadeEscolar.id,
    },
  });

  const componenteLP = await prisma.componenteCurricular.create({
    data: {
      ano_letivo: new Date().getFullYear(),
      turmaId: turmaT101.id,
      materiaId: materiaLP.id,
      professorId: perfilProfAda.id,
    },
  });

  await prisma.matriculas.createMany({
    data: [
      {
        alunoId: perfilAlunoAlan.id,
        turmaId: turmaT101.id,
        ano_letivo: new Date().getFullYear(),
        status: StatusMatricula.ATIVA,
      },
      {
        alunoId: perfilAlunaGrace.id,
        turmaId: turmaT101.id,
        ano_letivo: new Date().getFullYear(),
        status: StatusMatricula.ATIVA,
      },
    ],
  });
  console.log(`[OK] Estrutura acadêmica e matrículas criadas.`);

  console.log("🗓️  Montando Horário de Aulas...");
  await prisma.horarioAula.createMany({
    data: [
      {
        dia_semana: DiaDaSemana.SEGUNDA,
        hora_inicio: "08:00",
        hora_fim: "09:40",
        local: "Lab 01",
        instituicaoId: instituicao.id,
        turmaId: turmaT101.id,
        componenteCurricularId: componenteLP.id,
      },
      {
        dia_semana: DiaDaSemana.QUARTA,
        hora_inicio: "10:00",
        hora_fim: "11:40",
        local: "Lab 01",
        instituicaoId: instituicao.id,
        turmaId: turmaT101.id,
        componenteCurricularId: componenteLP.id,
      },
    ],
  });
  console.log(`[OK] Horário da turma ${turmaT101.nome} definido.`);

  console.log("📝 Criando Tarefas e Questões...");
  const tarefa = await prisma.tarefas.create({
    data: {
      titulo: "Introdução a Variáveis",
      descricao: "Lista de exercícios sobre declaração e uso de variáveis.",
      pontos: 100,
      publicado: true,
      data_entrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tipo: TipoTarefa.QUESTIONARIO,
      instituicaoId: instituicao.id,
      componenteCurricularId: componenteLP.id,
    },
  });

  const questao1 = await prisma.questoes.create({
    data: {
      sequencia: 1,
      tipo: TipoQuestao.MULTIPLA_ESCOLHA,
      titulo: "Variável Correta",
      enunciado: "Qual declaração de variável é válida em JavaScript?",
      pontos: 50,
      tarefaId: tarefa.id,
      instituicaoId: instituicao.id,
    },
  });

  const opcaoCorreta = await prisma.opcoes_Multipla_Escolha.create({
    data: {
      texto: "let nome = 'Alan';",
      correta: true,
      sequencia: 1,
      questaoId: questao1.id,
    },
  });
  await prisma.opcoes_Multipla_Escolha.create({
    data: {
      texto: "var = 'Alan';",
      correta: false,
      sequencia: 2,
      questaoId: questao1.id,
    },
  });
  console.log(`[OK] Tarefa "${tarefa.titulo}" e suas questões foram criadas.`);

  console.log("📤 Criando Submissão de Tarefa...");
  const submissaoAlan = await prisma.submissoes.create({
    data: {
      status: StatusSubmissao.ENVIADA,
      instituicaoId: instituicao.id,
      tarefaId: tarefa.id,
      alunoId: perfilAlunoAlan.id,
    },
  });

  await prisma.respostas_Submissao.create({
    data: {
      questaoId: questao1.id,
      submissaoId: submissaoAlan.id,
      opcaoEscolhidaId: opcaoCorreta.id,
    },
  });

  const conquistaTarefa = await prisma.conquistas.findUnique({
    where: { codigo: "PRIMEIRA_TAREFA" },
  });
  if (conquistaTarefa) {
    await prisma.conquistas_Usuarios.create({
      data: {
        conquistaId: conquistaTarefa.id,
        alunoPerfilId: perfilAlunoAlan.id,
      },
    });
    console.log(
      `[OK] Submissão criada e conquista concedida a ${alunoAlan.nome}.`
    );
  }

  console.log("💬 Simulando uma Conversa no Chat...");
  const conversa = await prisma.conversa.create({
    data: {
      instituicaoId: instituicao.id,
    },
  });

  await prisma.participante.createMany({
    data: [
      { conversaId: conversa.id, usuarioId: profAda.id },
      { conversaId: conversa.id, usuarioId: alunoAlan.id },
    ],
  });

  await prisma.mensagem.createMany({
    data: [
      {
        conversaId: conversa.id,
        autorId: alunoAlan.id,
        conteudo: "Olá professora, estou com uma dúvida sobre a tarefa.",
      },
      {
        conversaId: conversa.id,
        autorId: profAda.id,
        conteudo: "Olá, Alan! Pode perguntar.",
      },
    ],
  });
  console.log(
    `[OK] Conversa criada entre ${profAda.nome} e ${alunoAlan.nome}.`
  );
  console.log("💬 Simulando Comentários na Tarefa...");
  const comentarioAlan = await prisma.comentarioTarefa.create({
    data: {
      conteudo:
        "Professora, não entendi muito bem a parte sobre a declaração de variáveis. Poderia dar outro exemplo?",
      tarefaId: tarefa.id,
      autorId: alunoAlan.id,
      instituicaoId: instituicao.id,
    },
  });

  await prisma.comentarioTarefa.create({
    data: {
      conteudo:
        "Claro, Alan! Pense em uma variável como uma 'caixa' com uma etiqueta (o nome da variável) onde você guarda um valor para usar depois.",
      tarefaId: tarefa.id,
      autorId: profAda.id,
      instituicaoId: instituicao.id,
      comentarioPaiId: comentarioAlan.id,
    },
  });

  await prisma.comentarioTarefa.create({
    data: {
      conteudo:
        "Ótima pergunta, Alan! A explicação da professora ajudou muito!",
      tarefaId: tarefa.id,
      autorId: alunaGrace.id,
      instituicaoId: instituicao.id,
    },
  });
  console.log("[OK] Comentários e respostas na tarefa criados.");

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
