import { z } from "zod";

export const UnidadesEscolaresSchema = z.object({
  id: z.string().optional(),
  instituicaoId: z.string().cuid(),
  nome: z.string().min(1, { message: 'O nome da unidade escolar é obrigatório.' }),
  endereco: z.string().optional().nullable(),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});