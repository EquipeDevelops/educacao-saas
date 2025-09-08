import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: "O nome é obrigatório." }).min(3),
    email: z
      .string({ required_error: "O email é obrigatório." })
      .email("Formato de email inválido"),
    senha: z
      .string({ required_error: "A senha é obrigatória." })
      .min(8, "A senha deve ter no mínimo 8 caracteres."),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "O email é obrigatório." }).email(),
    senha: z.string({ required_error: "A senha é obrigatória." }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
