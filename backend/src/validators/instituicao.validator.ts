import { z } from "zod";

export const createInstituicaoSchema = z.object({
  body: z.object({
    nome: z
      .string({ required_error: "O nome é obrigatório." })
      .min(3, "O nome precisa ter no mínimo 3 caracteres."),

    cidade: z.string().optional(),

    metadados: z.record(z.any()).optional(),
  }),
});


export const TurmaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, { message: "O nome da turma é obrigatório." }),
  serie: z.string().min(1, { message: "A série é obrigatória." }),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
  instituicaoId: z.string(),
  unidadeEscolarId: z.string().optional().nullable(),
  professorId: z.string().optional().nullable(),
});

export type TurmaSchemaType = z.infer<typeof TurmaSchema>;


export const TarefaSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().min(1, { message: "O título da tarefa é obrigatório." }),
  descricao: z.string().optional().nullable(),
  pontos: z.number().int().optional().nullable(),
  data_entrega: z.date().optional().nullable(),
  publicado: z.boolean().default(false),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
  instituicaoId: z.string(),
  turmaId: z.string(),
  professorId: z.string(),
});

export type TarefaSchemaType = z.infer<typeof TarefaSchema>;


export const SubmissaoSchema = z.object({
  id: z.string().optional(),
  enviado_em: z.date().optional(),
  status: z.string(),
  nota_total: z.number().int(),
  feedback: z.string().optional().nullable(),
  metadados: z.record(z.string(), z.any()).optional().nullable(),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
  instituicaoId: z.string(),
  tarefaId: z.string(),
  alunoId: z.string(),
});

export type SubmissaoSchemaType = z.infer<typeof SubmissaoSchema>;



export const UnidadesEscolaresSchema = z.object({
  id: z.string().optional(),
  instituicaoId: z.string().cuid(), 
  nome: z.string().min(1, { message: 'O nome da unidade escolar é obrigatório.' }),
  endereco: z.string().optional().nullable(),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});

export const ConquistasSchema = z.object({
  id: z.string().optional(),
  instituicaoId: z.string().cuid(),
  codigo: z.string().min(1, { message: 'O código da conquista é obrigatório.' }),
  titulo: z.string().min(1, { message: 'O título da conquista é obrigatório.' }),
  descricao: z.string().optional().nullable(),
  criterios: z.record(z.string(), z.any()).optional().nullable(),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});

export const MatriculasSchema = z.object({
  id: z.string().optional(),
  data_matricula: z.date().optional(),
  status: z.boolean().default(true),
  alunoId: z.string().cuid(),
  turmaId: z.string().cuid(),
});

export const TopicoForumSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().min(1, { message: 'O título do tópico é obrigatório.' }),
  corpo: z.string().optional().nullable(),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
  instituicaoId: z.string().cuid(),
  usuarioId: z.string().cuid(),
});

export const QuestoesSchema = z.object({
  id: z.string().optional(),
  sequencia: z.number().int(),
  tipo: z.string().min(1, { message: 'O tipo da questão é obrigatório.' }),
  titulo: z.string().min(1, { message: 'O título da questão é obrigatório.' }),
  enunciado: z.string().min(1, { message: 'O enunciado é obrigatório.' }),
  payload: z.record(z.string(), z.any()),
  pontos: z.number().int().positive(),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
  tarefaId: z.string().cuid(),
  instituicaoId: z.string().cuid(),
});

export const MensagensForumSchema = z.object({
  id: z.string().optional(),
  corpo: z.string().min(1, { message: 'O corpo da mensagem não pode ser vazio.' }),
  criado_em: z.date().optional(),
  instituicaoId: z.string(),
  topicoId: z.string(),
  usuarioId: z.string(),
});

export const ArquivosSchema = z.object({
  id: z.string().optional(),
  chave: z.string().min(1, { message: 'A chave do arquivo é obrigatória.' }),
  nome: z.string().min(1, { message: 'O nome do arquivo é obrigatório.' }),
  tipo_conteudo: z.string().min(1, { message: 'O tipo de conteúdo é obrigatório.' }),
  tamanho: z.number().int().positive(),
  metadados: z.record(z.string(), z.any()).optional().nullable(),
  criado_em: z.date().optional(),
  instituicaoId: z.string(),
  usuarioId: z.string(),
});

export const OpcoesMultiplaEscolhaSchema = z.object({
  id: z.string().optional(),
  texto: z.string().min(1, { message: 'O texto da opção não pode ser vazio.' }),
  correta: z.boolean().default(false),
  sequencia: z.number().int(),
  criado_em: z.date().optional(),
  questaoId: z.string(),
});

export const RespostasSubmissaoSchema = z.object({
  id: z.string().optional(),
  resposta_texto: z.string().min(1, { message: 'A resposta não pode ser vazia.' }),
  nota: z.number().int(),
  avaliado_em: z.date().optional().nullable(),
  feedback: z.string().optional().nullable(),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
  questaoId: z.string(),
  submissaoId: z.string(),
});

