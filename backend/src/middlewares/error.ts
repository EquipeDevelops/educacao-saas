// Caminho: backend/src/middlewares/error.ts

import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError"; // <-- 1. IMPORTAMOS O AppError

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // --- Bloco de depuração (pode manter ou remover) ---
  console.error("\n--- [GLOBAL ERROR HANDLER] ---");
  console.error(`Rota: ${req.method} ${req.originalUrl}`);
  console.error("Nome do Erro:", err.name);
  console.error("Mensagem:", err.message);
  console.error("Stack:", err.stack);
  console.error("------------------------------");
  // --------------------------------------------------------

  // <-- 2. ADICIONAMOS O TRATAMENTO PARA AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Dados inválidos na requisição.",
      errors: err.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return res.status(409).json({
          message: `Conflito: o campo '${(err.meta?.target as string[])?.join(
            ", "
          )}' já existe.`,
        });
      case "P2025":
        return res.status(404).json({
          message: `O recurso solicitado com o ID fornecido não foi encontrado.`,
        });
      case "P2003":
        return res.status(409).json({
          message:
            "Impossível excluir. Existem outros registros associados a este item.",
        });
      default:
        break; // Deixa o handler genérico abaixo cuidar de outros erros do Prisma.
    }
  }

  // Handler genérico para todos os outros erros
  const isProduction = process.env.NODE_ENV === "production";
  return res.status(500).json({
    message: isProduction
      ? "Ocorreu um erro interno inesperado no servidor."
      : err.message,
    error: isProduction ? undefined : { name: err.name, stack: err.stack },
  });
};
