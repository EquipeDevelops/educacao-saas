import { z } from "zod";
import { PapelUsuario } from "@prisma/client";

export const paramsSchema = z.object({
  id: z.string().nonempty("O ID é obrigatório"),
});

const alunoProfileSchema = z.object({
  numero_matricula: z.string({
    required_error: "O número de matrícula é obrigatório.",
  }),
  email_responsavel: z
    .string()
    .email("Email do responsável inválido.")
    .optional(),
});

const professorProfileSchema = z.object({
  titulacao: z.string().optional(),
  area_especializacao: z.string().optional(),
});

export const createUserSchema = z.object({
  body: z
    .object({
      nome: z
        .string({ required_error: "O nome é obrigatório." })
        .min(3, "O nome deve ter no mínimo 3 caracteres."),
      email: z
        .string({ required_error: "O email é obrigatório." })
        .email("Formato de email inválido."),
      senha: z
        .string({ required_error: "A senha é obrigatória." })
        .min(6, "A senha deve ter no mínimo 6 caracteres."),
      papel: z.nativeEnum(PapelUsuario, {
        required_error: "O papel do usuário é obrigatório.",
      }),

      perfil_aluno: alunoProfileSchema.optional(),
      perfil_professor: professorProfileSchema.optional(),
    })
    .refine(
      (data) => {
        if (data.papel === PapelUsuario.ALUNO) {
          return !!data.perfil_aluno;
        }
        if (data.papel === PapelUsuario.PROFESSOR) {
          return !!data.perfil_professor;
        }
        return true;
      },
      {
        message:
          "O perfil correspondente ao papel do usuário não foi fornecido.",
        path: ["perfil_aluno", "perfil_professor"],
      }
    ),
});

export const updateUserSchema = z.object({
  body: z.object({
    nome: z
      .string()
      .min(3, "O nome deve ter no mínimo 3 caracteres.")
      .optional(),
    status: z.boolean().optional(),
    perfil_professor: professorProfileSchema.optional(),
  }),
  params: paramsSchema,
});

export const updateCredentialsSchema = z.object({
  body: z.object({
    email: z.string().email("Formato de email inválido.").optional(),
    currentPassword: z.string().min(6, "A senha atual deve ter no mínimo 6 caracteres.").optional(),
    newPassword: z
      .string()
      .min(6, "A nova senha deve ter no mínimo 6 caracteres.")
      .optional(),
  })
  .refine((data) => {
    return !!data.email || !!data.newPassword;
  }, { message: "Informe email ou nova senha." })
  .refine((data) => {
    if (data.newPassword) return !!data.currentPassword;
    return true;
  }, { message: "Senha atual é necessária para alterar a senha.", path: ["currentPassword"] }),
  params: paramsSchema,
});

export type UpdateCredentialsInput = z.infer<typeof updateCredentialsSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
