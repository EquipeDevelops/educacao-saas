import { z } from "zod";

export const createArquivoSchema = z.object({
  body: z.object({
    instituicaoId: z.string({
      required_error: "O ID da instituição é obrigatório.",
    }),
    usuarioId: z.string({ required_error: "O ID do usuário é obrigatório." }),
    metadados: z
      .string()
      .optional()
      .transform((val, ctx) => {
        if (!val) return undefined;
        try {
          return JSON.parse(val);
        } catch (e) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Metadados não é um JSON válido.",
          });
          return z.NEVER;
        }
      }),
  }),
});

export const updateArquivoSchema = z.object({
  body: z.object({
    nome: z.string().min(3).optional(),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID do arquivo é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID do arquivo é obrigatório." }),
  }),
});

export type UpdateArquivoInput = z.infer<typeof updateArquivoSchema>["body"];
export type ArquivoParams = z.infer<typeof paramsSchema>["params"];
