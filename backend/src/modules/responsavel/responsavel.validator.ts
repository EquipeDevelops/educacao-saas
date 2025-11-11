import { z } from "zod";

const paramsSchema = z.object({
  responsavelId: z.string({
    required_error: "O ID do responsável é obrigatório.",
  }),
});

export const linkAlunoSchema = z.object({
  params: paramsSchema,
  body: z.object({
    alunoId: z.string({
      required_error: "O ID do aluno é obrigatório.",
    }),
    parentesco: z.string().optional(),
    principal: z.boolean().optional(),
  }),
});

export const unlinkAlunoSchema = z.object({
  params: paramsSchema.extend({
    alunoId: z.string({
      required_error: "O ID do aluno é obrigatório.",
    }),
  }),
});
