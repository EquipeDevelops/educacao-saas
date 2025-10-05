import { z } from "zod";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID do comentário é obrigatório." }),
});

export const createComentarioSchema = z.object({
  body: z.object({
    conteudo: z
      .string({ required_error: "O conteúdo do comentário é obrigatório." })
      .min(1),
    tarefaId: z.string({ required_error: "O ID da tarefa é obrigatório." }),
    comentarioPaiId: z.string().optional(), // Para responder a outro comentário
  }),
});

export const updateComentarioSchema = z.object({
  body: z.object({
    conteudo: z.string({ required_error: "O conteúdo é obrigatório." }).min(1),
  }),
  params: paramsSchema,
});

export const findAllComentariosSchema = z.object({
  query: z.object({
    tarefaId: z.string({
      required_error: "O filtro por tarefaId é obrigatório.",
    }),
  }),
});

export type CreateComentarioInput = z.infer<
  typeof createComentarioSchema
>["body"];
export type UpdateComentarioInput = z.infer<typeof updateComentarioSchema>;
