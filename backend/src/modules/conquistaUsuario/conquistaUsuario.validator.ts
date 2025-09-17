import { z } from "zod";

export const paramsSchema = z.object({
  id: z.string({
    required_error: "O ID do registro da conquista é obrigatório.",
  }),
});

export const grantConquistaSchema = z.object({
  body: z.object({
    alunoPerfilId: z.string({
      required_error: "O ID do perfil do aluno é obrigatório.",
    }),
    conquistaId: z.string({
      required_error: "O ID da conquista é obrigatório.",
    }),
    metadados: z.record(z.any()).optional(),
  }),
});

export const findAllConquistasUsuarioSchema = z.object({
  query: z.object({
    alunoPerfilId: z.string().optional(),
    conquistaId: z.string().optional(),
  }),
});

export type GrantConquistaInput = z.infer<typeof grantConquistaSchema>["body"];
export type FindAllConquistasUsuarioInput = z.infer<
  typeof findAllConquistasUsuarioSchema
>["query"];
