import { z } from "zod";

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