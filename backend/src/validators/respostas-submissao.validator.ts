import { z } from "zod";

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