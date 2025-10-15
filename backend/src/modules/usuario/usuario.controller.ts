import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { usuarioService } from "./usuario.service";
import { CreateUserSchema, UpdateUserSchema } from "./usuario.validator";

export const usuarioController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData = CreateUserSchema.parse(req.body);
      const authReq = req as AuthenticatedRequest;
      const newUser = await usuarioService.createUser({
        ...userData,
        instituicaoId: authReq.user.instituicaoId!,
        unidadeEscolarId: authReq.user.unidadeEscolarId!,
      });
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const where = { unidadeEscolarId: authReq.user.unidadeEscolarId! };
      const users = await usuarioService.findAllUsers(where);
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const where = { unidadeEscolarId: authReq.user.unidadeEscolarId! };
      const user = await usuarioService.findUserById(id, where);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userData = UpdateUserSchema.parse(req.body);
      const authReq = req as AuthenticatedRequest;
      const where = { unidadeEscolarId: authReq.user.unidadeEscolarId! };
      const updatedUser = await usuarioService.updateUser(id, userData, where);
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const where = { unidadeEscolarId: authReq.user.unidadeEscolarId! };
      await usuarioService.deleteUser(id, where);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  importarAlunos: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado." });
      }
      const resultado = await usuarioService.importarAlunos(
        authReq.user,
        req.file.buffer
      );
      res.status(200).json({
        message: "Importação concluída.",
        ...resultado,
      });
    } catch (error) {
      next(error);
    }
  },
};
