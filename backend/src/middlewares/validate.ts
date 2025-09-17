import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Middleware de VALIDAÇÃO.
 * Recebe um schema Zod e o usa para validar o corpo, os parâmetros e a query da requisição.
 * @param schema - Um objeto schema do Zod (ex: { body: z.object({...}) })
 */
export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Dados inválidos na requisição.",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      return res.status(500).json({ message: "Erro interno no servidor." });
    }
  };
