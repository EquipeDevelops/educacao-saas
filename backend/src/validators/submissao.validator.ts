import { z } from "zod";

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