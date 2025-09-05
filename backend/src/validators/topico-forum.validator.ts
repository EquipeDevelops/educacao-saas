import { z } from "zod";

export const TopicoForumSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().min(1, { message: 'O título do tópico é obrigatório.' }),
  corpo: z.string().optional().nullable(),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
  instituicaoId: z.string().cuid(),
  usuarioId: z.string().cuid(),
});