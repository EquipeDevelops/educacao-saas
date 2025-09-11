import { z } from "zod";

export const awardConquistaSchema = z.object({
  body: z.object({
    usuarioId: z.string({ required_error: "O ID do usuário é obrigatório." }),
    conquistaId: z.string({
      required_error: "O ID da conquista é obrigatório.",
    }),
    metadados: z.record(z.any()).optional(),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: "O ID do registro da conquista é obrigatório.",
    }),
  }),
});

export type AwardConquistaInput = z.infer<typeof awardConquistaSchema>["body"];
