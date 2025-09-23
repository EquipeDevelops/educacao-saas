import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

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
          message: "O recurso solicitado não foi encontrado.",
        });
      default:
        break;
    }
  }

  const isProduction = process.env.NODE_ENV === "production";

  return res.status(500).json({
    message: isProduction
      ? "Ocorreu um erro interno inesperado no servidor."
      : "Erro interno do servidor.",
    error: isProduction
      ? undefined
      : {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
  });
};
