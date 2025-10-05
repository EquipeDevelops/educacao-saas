import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("[VALIDATE] Iniciando validação");
    console.log("[VALIDATE] Params:", req.params);
    console.log("[VALIDATE] Body:", req.body);
    console.log("[VALIDATE] Query:", req.query);

    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      console.log("[VALIDATE] Validação passou com sucesso");
      return next();
    } catch (error) {
      console.log("[VALIDATE] Erro na validação:", error);

      if (error instanceof ZodError) {
        console.log("[VALIDATE] Erro Zod:", error.issues);
        return res.status(400).json({
          message: "Dados inválidos na requisição.",
          errors: error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      console.log("[VALIDATE] Erro não-Zod:", error);
      return res.status(500).json({ message: "Erro interno no servidor." });
    }
  };
