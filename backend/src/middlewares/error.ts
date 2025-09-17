import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/**
 * Middleware de Tratamento de Erros Global.
 * Captura todos os erros que ocorrem na aplicação em um só lugar.
 * Deve ser o ÚLTIMO middleware a ser adicionado no seu arquivo de servidor (server.ts/app.ts).
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction // O 'next' precisa estar aqui, mesmo que não usado.
) => {
  // SEGURANÇA: Logamos o erro completo no servidor para fins de depuração.
  // Em produção, isso deveria ser enviado para um serviço de logging (Sentry, Datadog, etc.).
  console.error(err);

  // --- Tratamento de Erros Conhecidos ---

  // Erros de validação do Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Dados inválidos na requisição.",
      errors: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Erros conhecidos do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": // Violação de constraint única
        return res.status(409).json({
          message: `Conflito: o campo '${(err.meta?.target as string[])?.join(
            ", "
          )}' já existe.`,
        });
      case "P2025": // Registro não encontrado para uma operação
        return res.status(404).json({
          message: "O recurso solicitado não foi encontrado.",
        });
      default:
        // Outros erros do Prisma
        break;
    }
  }

  // --- Fallback para Erros Inesperados ---

  // SEGURANÇA E LGPD: Em um ambiente de produção, nunca vaze detalhes do erro.
  const isProduction = process.env.NODE_ENV === "production";

  return res.status(500).json({
    message: isProduction
      ? "Ocorreu um erro interno inesperado no servidor."
      : "Erro interno do servidor.",
    // Apenas em desenvolvimento, mostramos o erro detalhado.
    error: isProduction
      ? undefined
      : {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
  });
};
