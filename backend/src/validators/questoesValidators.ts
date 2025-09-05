import { z } from "zod";

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