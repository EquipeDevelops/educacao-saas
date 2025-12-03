import { Request, Response, NextFunction } from 'express';
import { comunicadoService } from './comunicado.service';
import { AuthenticatedRequest } from '../../middlewares/auth';

export const comunicadoController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { unidadeEscolarId, id: userId } = authReq.user;

      if (!unidadeEscolarId) {
        return res
          .status(400)
          .json({ message: 'Usuário não vinculado a uma unidade escolar.' });
      }

      let imagens: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        const protocol = req.protocol;
        const host = req.get('host');
        imagens = (req.files as Express.Multer.File[]).map(
          (file) => `${protocol}://${host}/uploads/${file.filename}`,
        );
      }

      const comunicado = await comunicadoService.create(
        {
          ...req.body,
          data_visivel: new Date(req.body.data_visivel),
          imagens,
        },
        unidadeEscolarId,
        userId,
      );
      res.status(201).json(comunicado);
    } catch (error) {
      next(error);
    }
  },

  findAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { unidadeEscolarId } = authReq.user;

      if (!unidadeEscolarId) {
        return res
          .status(400)
          .json({ message: 'Usuário não vinculado a uma unidade escolar.' });
      }

      const comunicados = await comunicadoService.findAll(unidadeEscolarId);
      res.json(comunicados);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const authReq = req as unknown as AuthenticatedRequest;
      const { unidadeEscolarId } = authReq.user;

      if (!unidadeEscolarId) {
        return res
          .status(400)
          .json({ message: 'Usuário não vinculado a uma unidade escolar.' });
      }

      let newImagens: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const protocol = req.protocol;
        const host = req.get('host');
        newImagens = (req.files as Express.Multer.File[]).map(
          (file) => `${protocol}://${host}/uploads/${file.filename}`,
        );
      }

      const updateData = { ...req.body };
      if (updateData.data_visivel) {
        updateData.data_visivel = new Date(updateData.data_visivel);
      }

      const existingImagens = req.body.existingImagens || [];

      if (req.body.existingImagens !== undefined || newImagens.length > 0) {
        updateData.imagens = [
          ...(Array.isArray(existingImagens) ? existingImagens : []),
          ...newImagens,
        ];
      }

      delete updateData.existingImagens;

      const comunicado = await comunicadoService.update(
        id,
        updateData,
        unidadeEscolarId,
      );
      res.json(comunicado);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const authReq = req as unknown as AuthenticatedRequest;
      const { unidadeEscolarId } = authReq.user;

      if (!unidadeEscolarId) {
        return res
          .status(400)
          .json({ message: 'Usuário não vinculado a uma unidade escolar.' });
      }

      await comunicadoService.delete(id, unidadeEscolarId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
