// Caminho: backend/src/middlewares/error.ts

import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // --- ADICIONADO PARA DEPURAÇÃO ---
  console.error("\n--- [GLOBAL ERROR HANDLER] UM ERRO FOI CAPTURADO! ---");
  console.error(
    `[ERROR HANDLER] Rota do Erro: ${req.method} ${req.originalUrl}`
  );
  console.error("[ERROR HANDLER] Nome do Erro:", err.name);
  console.error("[ERROR HANDLER] Mensagem do Erro:", err.message);
  console.error("[ERROR HANDLER] Stack Trace:", err.stack);
  console.error("-------------------------------------------------");
  // --------------------------------------------------------

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Dados inválidos na requisição.",
      errors: err.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Variável para determinar se vamos retornar o stack trace
  const isProduction = process.env.NODE_ENV === "production";
  let responseMessage = isProduction
    ? "Ocorreu um erro interno inesperado no servidor."
    : "Erro interno do servidor: Exceção não mapeada.";
  let statusCode = 500;
  let responseDetails: any = isProduction
    ? undefined
    : {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    responseDetails = isProduction
      ? undefined
      : {
          ...responseDetails,
          code: err.code,
          meta: err.meta,
        };

    switch (err.code) {
      case "P2002":
        statusCode = 409;
        responseMessage = `Conflito: o campo '${(
          err.meta?.target as string[]
        )?.join(", ")}' já existe.`;
        responseDetails = undefined;
        break;
      case "P2025":
        statusCode = 404;
        responseMessage = "O recurso solicitado não foi encontrado.";
        responseDetails = undefined;
        break;
      case "P2003": // Foreign key constraint violation (Impossível excluir com dependências)
        statusCode = 409;
        responseMessage =
          "Impossível excluir. Existem itens (Questões, Submissões, etc.) associados a este recurso.";
        responseDetails = undefined;
        break;
      default:
        // Erro genérico do Prisma (ex: falha de conexão)
        statusCode = 500;
        responseMessage = isProduction
          ? "Ocorreu um erro interno inesperado no servidor (Erro no DB)."
          : "Erro interno do servidor: " + err.message; // Retorna a mensagem do Prisma em dev
        break;
    }
  }

  return res.status(statusCode).json({
    message: responseMessage,
    error: responseDetails,
  });
};
