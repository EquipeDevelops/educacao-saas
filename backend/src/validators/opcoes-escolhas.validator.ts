import { z } from "zod";

export const OpcoesMultiplaEscolhaSchema = z.object({
  id: z.string().optional(),
  texto: z.string().min(1, { message: 'O texto da opção não pode ser vazio.' }),
  correta: z.boolean().default(false),
  sequencia: z.number().int(),
  criado_em: z.date().optional(),
  questaoId: z.string(),
});