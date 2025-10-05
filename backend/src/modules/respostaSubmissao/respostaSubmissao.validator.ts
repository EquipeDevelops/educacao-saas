import { z } from "zod";

const respostaSchema = z
  .object({
    questaoId: z.string({ required_error: "O ID da questão é obrigatório." }),
    resposta_texto: z.string().optional(),
    opcaoEscolhidaId: z.string().optional(),
  })
  .refine((data) => data.resposta_texto || data.opcaoEscolhidaId, {
    message:
      "É necessário fornecer ou um texto de resposta ou uma opção escolhida.",
  });

export const saveRespostasSchema = z.object({
  params: z.object({
    submissaoId: z.string({
      required_error: "O ID da submissão é obrigatório.",
    }),
  }),
  body: z.object({
    respostas: z
      .array(respostaSchema)
      .nonempty("É necessário fornecer pelo menos uma resposta."),
  }),
});

export const gradeRespostaSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID da resposta é obrigatório." }),
  }),
  body: z.object({
    nota: z.number({ required_error: "A nota é obrigatória." }).min(0),
    feedback: z.string().optional(),
  }),
});

export type SaveRespostasInput = z.infer<typeof saveRespostasSchema>;
export type GradeRespostaInput = z.infer<typeof gradeRespostaSchema>;
