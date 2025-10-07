// Caminho: modules/redefinirsenha/redefinirSenha.Controller.ts

import { Request, Response } from "express";
import { solicitarRedefinicao, redefinirSenha } from "./redefinirSenha.Service";

// -----------------------------------------------------------------------------
// Função controladora para a rota de "Esqueci a Senha" (Forgot Password)
// -----------------------------------------------------------------------------
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  // A validação de e-mail malformado será tratada pelo middleware Zod/validate.
  // Aqui, verificamos apenas a presença da chave 'email'.
  if (!email) {
    return res.status(400).json({ error: "Informe o e-mail." });
  }

  try {
    // O Service solicitaRedefinicao(email) é chamado e trata a busca do usuário
    await solicitarRedefinicao(email); 

    // Mensagem de segurança: não informa se o e-mail existe
    return res.json({
      message: "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
    });

  } catch (error) {
    console.error("Erro ao solicitar redefinição:", error);
    return res.status(500).json({ error: "Erro interno ao processar a solicitação." });
  }
}

// -----------------------------------------------------------------------------
// Função controladora para a rota de Redefinir Senha (Reset Password)
// -----------------------------------------------------------------------------
export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;

  // A validação detalhada é feita pelo middleware Zod/validate,
  // aqui verificamos apenas a presença dos campos.
  if (!token || !password) {
    return res.status(400).json({ error: "Informe o token e a nova senha." });
  }

  try {
    const result = await redefinirSenha({ token, password }); // Passa como objeto, conforme a interface ResetPasswordInput
    return res.json(result);
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Este link expirou." });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ error: "Token inválido." });
    }
    // Lança erros de lógica do Service (ex: link já usado) como 500 com a mensagem
    return res.status(500).json({ error: error.message || "Erro ao redefinir a senha." });
  }
}