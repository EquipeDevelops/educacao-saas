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
    componentes: ["Biologia", "Física", "Química"],
  },
  {
    codigo: "EM13CNT201",
    descricao:
      "Investigar, a partir de problemas do cotidiano, modelos científicos que expliquem transformações de matéria e energia, avaliando limites, previsões e aplicações para a vida em sociedade.",
    etapa: "EM",
    area: "CIENCIAS_DA_NATUREZA",
    componentes: ["Biologia", "Química"],
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
    componentes: ["Língua Portuguesa", "Artes", "Educação Física"],
  },
  {
    codigo: "EM13CHS102",
    descricao:
      "Relacionar processos históricos, geográficos e socioculturais para compreender desigualdades e propor ações de participação cidadã.",
    etapa: "EM",
    area: "CIENCIAS_HUMANAS",
    componentes: ["História", "Geografia", "Sociologia", "Filosofia"],
  },
  {
    codigo: "EM13LP19",
    descricao:
      "Selecionar e utilizar diferentes estratégias de leitura para analisar criticamente discursos midiáticos e suas intenções comunicativas.",
    etapa: "EM",
    area: "LINGUAGENS",
    componentes: ["Língua Portuguesa"],
  },
  {
    codigo: "EM13CHS305",
    descricao:
      "Avaliar impactos de decisões econômicas, políticas e ambientais em diferentes escalas e tempos históricos, identificando possibilidades de ação coletiva.",
    etapa: "EM",
    area: "CIENCIAS_HUMANAS",
    componentes: ["Geografia", "História"],
  },
];
