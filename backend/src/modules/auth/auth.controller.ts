import { Request, Response } from "express";
import { authService } from "./auth.service";
import { RegisterInput, LoginInput } from "./auth.validator";

export const authController = {
  register: async (req: Request<{}, {}, RegisterInput>, res: Response) => {
    try {
      const novoUsuario = await authService.register(req.body);
      return res.status(201).json(novoUsuario);
    } catch (error: any) {
      if (error.message.includes("email já está em uso")) {
        return res.status(409).json({ message: error.message });
      }
      if (error.message.includes("Instituição não encontrada")) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Erro ao registrar usuário." });
    }
  },

  login: async (req: Request<{}, {}, LoginInput>, res: Response) => {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  },
};
