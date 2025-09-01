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
