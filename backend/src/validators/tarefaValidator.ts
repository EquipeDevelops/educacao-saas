import { z } from "zod";

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