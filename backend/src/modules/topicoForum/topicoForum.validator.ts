import { z } from "zod";

export const createTopicoSchema = z.object({
  body: z.object({
    titulo: z
      .string({ required_error: "O título do tópico é obrigatório." })
      .min(5),
    corpo: z.string().optional(),
    instituicaoId: z.string({
      required_error: "O ID da instituição é obrigatório.",
    }),
    usuarioId: z.string({
      required_error: "O ID do usuário criador é obrigatório.",
    }),
  }),
});

export const updateTopicoSchema = z.object({
  body: z.object({
    titulo: z.string().min(5).optional(),
    corpo: z.string().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID do tópico é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID do tópico é obrigatório." }),
  }),
});

export type CreateTopicoInput = z.infer<typeof createTopicoSchema>["body"];
export type UpdateTopicoInput = z.infer<typeof updateTopicoSchema>["body"];
export type TopicoParams = z.infer<typeof paramsSchema>["params"];
