export type BnccFallbackEntry = {
  codigo: string;
  descricao: string;
  etapa: string;
  area: string;
  componentes: string[];
};

export const bnccFallback: BnccFallbackEntry[] = [
  {
    codigo: "EM13CNT310",
    descricao:
      "Analisar e discutir as implicações sociais, ambientais, políticas e econômicas do desenvolvimento científico e tecnológico para propor ações responsáveis e alinhadas à sustentabilidade.",
    etapa: "EM",
    area: "CIENCIAS_DA_NATUREZA",
    componentes: ["Biologia", "Física", "Química", "Ciências da Natureza"],
  },
  {
    codigo: "EM13CNT201",
    descricao:
      "Investigar, a partir de problemas do cotidiano, modelos científicos que expliquem transformações de matéria e energia, avaliando limites, previsões e aplicações para a vida em sociedade.",
    etapa: "EM",
    area: "CIENCIAS_DA_NATUREZA",
    componentes: ["Biologia", "Química", "Ciências da Natureza"],
  },
  {
    codigo: "EM13MAT102",
    descricao:
      "Modelar e resolver problemas que envolvam funções polinomiais de 1º e 2º graus para interpretar comportamentos de grandezas em contextos diversos.",
    etapa: "EM",
    area: "MATEMATICA",
    componentes: ["Matemática"],
  },
  {
    codigo: "EM13MAT405",
    descricao:
      "Utilizar conceitos estatísticos e probabilísticos para analisar criticamente conjuntos de dados, formular hipóteses e comunicar conclusões de maneira fundamentada.",
    etapa: "EM",
    area: "MATEMATICA",
    componentes: ["Matemática"],
  },
  {
    codigo: "EM13LP28",
    descricao:
      "Produzir textos multimodais que articulem argumentos éticos, estéticos e culturais para intervir em debates contemporâneos.",
    etapa: "EM",
    area: "LINGUAGENS",
    componentes: [
      "Língua Portuguesa",
      "Artes",
      "Educação Física",
      "Linguagens",
    ],
  },
  {
    codigo: "EM13CHS102",
    descricao:
      "Relacionar processos históricos, geográficos e socioculturais para compreender desigualdades e propor ações de participação cidadã.",
    etapa: "EM",
    area: "CIENCIAS_HUMANAS",
    componentes: [
      "História",
      "Geografia",
      "Sociologia",
      "Filosofia",
      "Ciências Humanas",
    ],
  },
  {
    codigo: "EM13LP19",
    descricao:
      "Selecionar e utilizar diferentes estratégias de leitura para analisar criticamente discursos midiáticos e suas intenções comunicativas.",
    etapa: "EM",
    area: "LINGUAGENS",
    componentes: ["Língua Portuguesa", "Português", "Linguagens"],
  },
  {
    codigo: "EM13CHS305",
    descricao:
      "Avaliar impactos de decisões econômicas, políticas e ambientais em diferentes escalas e tempos históricos, identificando possibilidades de ação coletiva.",
    etapa: "EM",
    area: "CIENCIAS_HUMANAS",
    componentes: ["Geografia", "História", "Ciências Humanas"],
  },

  {
    codigo: "EF69LP01",
    descricao:
      "Diferenciar liberdade de expressão de discursos de ódio, posicionando-se contrariamente a esse tipo de discurso e vislumbrando possibilidades de denúncia quando for o caso.",
    etapa: "EF",
    area: "LINGUAGENS",
    componentes: ["Língua Portuguesa", "Português"],
  },
  {
    codigo: "EF69LP07",
    descricao:
      "Produzir textos em diferentes gêneros, considerando sua adequação ao contexto produção e circulação.",
    etapa: "EF",
    area: "LINGUAGENS",
    componentes: ["Língua Portuguesa", "Português"],
  },
  {
    codigo: "EF89LP03",
    descricao:
      "Analisar textos de opinião (artigos de opinião, editoriais, cartas de leitores, comentários, posts de blog e de redes sociais, charges, memes, gifs etc.) e posicionar-se de forma crítica e fundamentada, ética e respeitosa frente a fatos e opiniões relacionados a esses textos.",
    etapa: "EF",
    area: "LINGUAGENS",
    componentes: ["Língua Portuguesa", "Português"],
  },
  {
    codigo: "EF09LP01",
    descricao:
      "Analisar o fenômeno da disseminação de notícias falsas nas redes sociais e desenvolver estratégias para reconhecê-las, a partir da verificação/avaliação do veículo, fonte, data e local da publicação, autoria, URL, da análise da formatação, da comparação de diferentes fontes, da consulta a sites de curadoria.",
    etapa: "EF",
    area: "LINGUAGENS",
    componentes: ["Língua Portuguesa", "Português"],
  },

  {
    codigo: "EF06MA03",
    descricao:
      "Resolver e elaborar problemas que envolvam cálculos (mentais ou escritos, exatos ou aproximados) com números naturais, por meio de estratégias variadas, com compreensão dos processos neles envolvidos com e sem uso de calculadora.",
    etapa: "EF",
    area: "MATEMATICA",
    componentes: ["Matemática"],
  },
  {
    codigo: "EF07MA02",
    descricao:
      "Resolver e elaborar problemas que envolvam porcentagens, como os que lidam com acréscimos e decréscimos simples, utilizando estratégias pessoais, cálculo mental e calculadora, no contexto de educação financeira, entre outros.",
    etapa: "EF",
    area: "MATEMATICA",
    componentes: ["Matemática"],
  },
  {
    codigo: "EF08MA01",
    descricao:
      "Efetuar cálculos com potências de expoentes inteiros e aplicar esse conhecimento na representação de números em notação científica.",
    etapa: "EF",
    area: "MATEMATICA",
    componentes: ["Matemática"],
  },
  {
    codigo: "EF09MA01",
    descricao:
      "Reconhecer que, uma vez fixada uma unidade de comprimento, existem segmentos de reta cujo comprimento não é expresso por número racional (como as medidas de diagonais de um polígono e alturas de um triângulo equilátero).",
    etapa: "EF",
    area: "MATEMATICA",
    componentes: ["Matemática"],
  },
  {
    codigo: "EF09MA05",
    descricao:
      "Resolver e elaborar problemas que envolvam porcentagens, com a ideia de aplicação de percentuais sucessivos e a determinação das taxas percentuais, preferencialmente com o uso de tecnologias digitais, no contexto da educação financeira.",
    etapa: "EF",
    area: "MATEMATICA",
    componentes: ["Matemática"],
  },

  {
    codigo: "EF06CI05",
    descricao:
      "Explicar a organização básica das células e seu papel como unidade estrutural e funcional dos seres vivos.",
    etapa: "EF",
    area: "CIENCIAS_DA_NATUREZA",
    componentes: ["Ciências"],
  },
  {
    codigo: "EF07CI05",
    descricao:
      "Discutir o uso de diferentes tipos de combustíveis e máquinas térmicas ao longo do tempo, para avaliar avanços, problemas socioambientais e perspectivas futuras.",
    etapa: "EF",
    area: "CIENCIAS_DA_NATUREZA",
    componentes: ["Ciências"],
  },
  {
    codigo: "EF08CI01",
    descricao:
      "Identificar e classificar diferentes fontes (renováveis e não renováveis) e tipos de energia utilizados em residências, comunidades ou cidades.",
    etapa: "EF",
    area: "CIENCIAS_DA_NATUREZA",
    componentes: ["Ciências"],
  },
  {
    codigo: "EF09CI01",
    descricao:
      "Analisar e discutir os impactos de ações antrópicas (desmatamento, queimadas, poluição, etc.) sobre a biodiversidade e os ecossistemas.",
    etapa: "EF",
    area: "CIENCIAS_DA_NATUREZA",
    componentes: ["Ciências"],
  },
  {
    codigo: "EF09CI07",
    descricao:
      "Discutir o papel do avanço tecnológico na aplicação das leis da Física (termodinâmica, eletromagnetismo, etc.) para o desenvolvimento de máquinas e equipamentos.",
    etapa: "EF",
    area: "CIENCIAS_DA_NATUREZA",
    componentes: ["Ciências"],
  },

  {
    codigo: "EF06HI01",
    descricao:
      "Identificar diferentes formas de compreensão da noção de tempo e de periodização dos processos históricos (continuidades e rupturas).",
    etapa: "EF",
    area: "CIENCIAS_HUMANAS",
    componentes: ["História"],
  },
  {
    codigo: "EF07HI02",
    descricao:
      "Identificar conexões e interações entre as sociedades do Novo Mundo, da Europa, da África e da Ásia no contexto das navegações e da formação do mundo moderno.",
    etapa: "EF",
    area: "CIENCIAS_HUMANAS",
    componentes: ["História"],
  },
  {
    codigo: "EF08HI01",
    descricao:
      "Identificar os principais aspectos conceituais do Iluminismo e do liberalismo e discutir a relação entre eles e a organização do mundo contemporâneo.",
    etapa: "EF",
    area: "CIENCIAS_HUMANAS",
    componentes: ["História"],
  },
  {
    codigo: "EF09HI01",
    descricao:
      "Descrever e contextualizar os principais aspectos sociais, culturais, econômicos e políticos da emergência da República no Brasil.",
    etapa: "EF",
    area: "CIENCIAS_HUMANAS",
    componentes: ["História"],
  },
  {
    codigo: "EF09HI05",
    descricao:
      "Identificar os processos de urbanização e modernização da sociedade brasileira e avaliar suas contradições e impactos na região em que vive.",
    etapa: "EF",
    area: "CIENCIAS_HUMANAS",
    componentes: ["História"],
  },

  {
    codigo: "EF06GE01",
    descricao:
      "Comparar diferentes representações cartográficas, analisando as distorções de projeções e a escolha da escala em função dos objetivos propostos.",
    etapa: "EF",
    area: "CIENCIAS_HUMANAS",
    componentes: ["Geografia"],
  },
  {
    codigo: "EF07GE01",
    descricao:
      "Analisar a formação de territórios e fronteiras em diferentes tempos e escalas, identificando os conflitos e as tensões envolvidas.",
    etapa: "EF",
    area: "CIENCIAS_HUMANAS",
    componentes: ["Geografia"],
  },
  {
    codigo: "EF08GE01",
    descricao:
      "Descrever as rotas de fluxos migratórios (internacionais e nacionais) e seus principais fatores (econômicos, sociais, culturais e políticos).",
    etapa: "EF",
    area: "CIENCIAS_HUMANAS",
    componentes: ["Geografia"],
  },
  {
    codigo: "EF09GE01",
    descricao:
      "Analisar criticamente de que forma a hegemonia europeia foi exercida em várias regiões do planeta, notadamente em situações de conflito, intervenções militares e/ou influência cultural em diferentes tempos e lugares.",
    etapa: "EF",
    area: "CIENCIAS_HUMANAS",
    componentes: ["Geografia"],
  },

  {
    codigo: "EF69AR01",
    descricao:
      "Pesquisar, apreciar e analisar formas distintas das artes visuais tradicionais e contemporâneas, em obras de artistas brasileiros e estrangeiros de diferentes épocas e em diferentes matrizes estéticas e culturais.",
    etapa: "EF",
    area: "LINGUAGENS",
    componentes: ["Arte", "Artes"],
  },
  {
    codigo: "EF69AR09",
    descricao:
      "Pesquisar e analisar diferentes formas de expressão, representação e encenação da dança, reconhecendo e apreciando composições de dança de artistas e grupos brasileiros e estrangeiros de diferentes épocas.",
    etapa: "EF",
    area: "LINGUAGENS",
    componentes: ["Arte", "Artes"],
  },

  {
    codigo: "EF89EF01",
    descricao:
      "Experimentar e fruir diferentes práticas corporais de aventura urbanas, valorizando a própria segurança e integridade física, bem como as dos demais.",
    etapa: "EF",
    area: "LINGUAGENS",
    componentes: ["Educação Física", "Ed Física"],
  },
  {
    codigo: "EF89EF11",
    descricao:
      "Identificar as diferenças e semelhanças entre a ginástica de conscientização corporal e as de condicionamento físico e discutir como a prática de cada uma dessas manifestações pode contribuir para a melhoria das condições de vida, saúde, bem-estar e cuidado de si mesmo.",
    etapa: "EF",
    area: "LINGUAGENS",
    componentes: ["Educação Física", "Ed Física"],
  },

  {
    codigo: "EF09ER01",
    descricao:
      "Analisar princípios e orientações para o cuidado da vida e a promoção da cultura de paz nas diversas tradições religiosas e filosofias de vida.",
    etapa: "EF",
    area: "CIENCIAS_HUMANAS",
    componentes: ["Ensino Religioso"],
  },
  {
    codigo: "EF09ER06",
    descricao:
      "Reconhecer a coexistência como uma atitude ética de respeito à vida e à dignidade humana.",
    etapa: "EF",
    area: "CIENCIAS_HUMANAS",
    componentes: ["Ensino Religioso"],
  },
];
