import { z } from "zod";
export const toggleConquistaSchema = z.object({
  body: z.object({
    conquistaId: z.string({
      required_error: "O ID da conquista é obrigatório.",
    }),
    ativo: z.boolean({ required_error: "O status 'ativo' é obrigatório." }),
  }),
});
