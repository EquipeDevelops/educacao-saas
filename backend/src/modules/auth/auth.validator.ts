import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "O email é obrigatório." })
      .email("Formato de email inválido."),
    senha: z.string({ required_error: "A senha é obrigatória." }),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "O email é obrigatório." })
      .email("Formato de email inválido."),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string({
      required_error: "O token de redefinição é obrigatório.",
    }),
  }),
  body: z
    .object({
      senha: z
        .string({ required_error: "A nova senha é obrigatória." })
        .min(6, "A senha deve ter no mínimo 6 caracteres."),
      confirmacaoSenha: z.string({
        required_error: "A confirmação de senha é obrigatória.",
      }),
    })
    .refine((data) => data.senha === data.confirmacaoSenha, {
      message: "As senhas não coincidem.",
      path: ["confirmacaoSenha"], // Indica o campo do erro
    }),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
