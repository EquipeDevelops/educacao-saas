import { Request, Response, NextFunction } from 'express';
import { usuarioService } from './usuario.service';
import { RequestWithPrisma } from '../../middlewares/prisma-context';

export const usuarioController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as RequestWithPrisma;
      let fotoUrl = null;

      if (req.file) {
        const protocol = req.protocol;
        const host = req.get('host');
        fotoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      }

      const newUser = await usuarioService.createUser(
        {
          ...req.body,
          fotoUrl,
          instituicaoId: authReq.user.instituicaoId!,
          unidadeEscolarId: authReq.user.unidadeEscolarId!,
        },
        authReq.prismaWithAudit as any,
      );
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as RequestWithPrisma;
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
      const authReq = req as unknown as RequestWithPrisma;
      const where = { unidadeEscolarId: authReq.user.unidadeEscolarId! };
      const user = await usuarioService.findUserById(id, where);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as RequestWithPrisma;
      const id = authReq.user.id;
      const where = { unidadeEscolarId: authReq.user.unidadeEscolarId! };
      const user = await usuarioService.findUserById(id, where);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const authReq = req as unknown as RequestWithPrisma;
      const where = { unidadeEscolarId: authReq.user.unidadeEscolarId! };

      let fotoUrl = undefined;
      if (req.file) {
        const protocol = req.protocol;
        const host = req.get('host');
        fotoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      }

      const updatedUser = await usuarioService.updateUser(
        id,
        { ...req.body, ...(fotoUrl && { fotoUrl }) },
        where,
        authReq.prismaWithAudit as any,
      );
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const authReq = req as unknown as RequestWithPrisma;
      const where = { unidadeEscolarId: authReq.user.unidadeEscolarId! };
      await usuarioService.deleteUser(id, where, authReq.prismaWithAudit);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  importarAlunos: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as RequestWithPrisma;
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
      }
      const resultado = await usuarioService.importarAlunos(
        authReq.user,
        req.file.buffer,
        authReq.prismaWithAudit as any,
      );
      res.status(200).json({
        message: 'Importação concluída.',
        ...resultado,
      });
    } catch (error) {
      next(error);
    }
  },
};
