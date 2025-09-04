import { z } from "zod";

export const MensagensForumSchema = z.object({
  id: z.string().optional(),
  corpo: z.string().min(1, { message: 'O corpo da mensagem não pode ser vazio.' }),
  criado_em: z.date().optional(),
  instituicaoId: z.string(),
  topicoId: z.string(),
  usuarioId: z.string(),
});