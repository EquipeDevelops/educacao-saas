import { Request, Response } from 'express';
import * as authService from './auth.service';
import { ResetPasswordInput } from './auth.validator';

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { usuario, token } = await authService.login(req.body);
      return res.status(200).json({ token, usuario });
    } catch (error: any) {
      return res.status(401).json({ message: error.message }); // 401 Unauthorized
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      await authService.forgotPassword(req.body.email);
      // SEGURANÇA: Sempre retorne uma mensagem de sucesso genérica.
      return res.status(200).json({
        message:
          'Se um usuário com este email existir, um link de redefinição de senha foi enviado.',
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { code, senha } = req.body as ResetPasswordInput['body'];
      await authService.resetPassword(code, senha);
      return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },
};
