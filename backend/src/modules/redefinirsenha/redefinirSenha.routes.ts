// Caminho: modules/redefinirsenha/redefinirSenha.routes.ts

import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { z } from "zod";

// ✅ Importa as funções do controller dentro desta mesma pasta
import { forgotPassword, resetPassword } from "./redefinirSenha.Controller"; 

// --- Schemas Zod ---

// Schema para a solicitação de redefinição de senha (POST /forgot-password)
const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("E-mail inválido."),
    }),
  });


// Schema para a redefinição de senha (POST /reset-password)
const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "O token é obrigatório."),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  }),
});


const router = Router();

// Rota para solicitar o link de redefinição
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword 
);

// Rota para efetivamente redefinir a senha
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword 
);

export const redefinirSenhaRoutes = router;