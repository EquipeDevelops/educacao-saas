import { z } from "zod";

export const questaoParamsSchema = z.object({
  questaoId: z.string({ required_error: "O ID da questão é obrigatório." }),
});

const opcaoSchema = z.object({
  texto: z.string({ required_error: "O texto da opção é obrigatório." }).min(1),
  correta: z.boolean({
    required_error: "É necessário indicar se a opção é correta.",
  }),
  sequencia: z
    .number({ required_error: "A sequência é obrigatória." })
    .int()
    .positive(),
});

// Schema para definir/sobrescrever TODAS as opções de uma questão
export const setOpcoesSchema = z.object({
  params: questaoParamsSchema,
  body: z.object({
    opcoes: z
      .array(opcaoSchema)
      .nonempty("É necessário fornecer pelo menos uma opção."),
  }),
});

// Schemas para gerenciar uma única opção (menos comum, mas bom ter)
export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da opção é obrigatório." }),
});

export const updateOpcaoSchema = z.object({
  body: opcaoSchema.partial(), // Todos os campos são opcionais
  params: paramsSchema,
});

export type SetOpcoesInput = z.infer<typeof setOpcoesSchema>;
export type UpdateOpcaoInput = z.infer<typeof updateOpcaoSchema>;
