import { Response, NextFunction } from 'express';
import { turmaService } from './turma.service';
import { CreateTurmaInput } from './turma.validator';
import { AuthenticatedRequest } from '../../middlewares/auth';

export const turmaController = {
  create: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    console.log('[TurmaController] Recebida requisição para CRIAR turma.');
    try {
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res.status(403).json({
          message: 'Apenas gestores de uma unidade escolar podem criar turmas.',
        });
      }
      const turma = await turmaService.create(
        req.body as CreateTurmaInput,
        unidadeEscolarId,
      );
      console.log(`[TurmaController] Turma criada com sucesso: ${turma.id}`);
      return res.status(201).json(turma);
    } catch (error) {
      console.error('[TurmaController] Erro ao CRIAR turma:', error);
      next(error);
    }
  },

  findAll: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    console.log('[TurmaController] Recebida requisição para LISTAR turmas.');
    try {
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res.status(200).json([]);
      }
      const turmas = await turmaService.findAll(unidadeEscolarId);
      console.log(`[TurmaController] ${turmas.length} turmas encontradas.`);
      return res.status(200).json(turmas);
    } catch (error) {
      console.error('[TurmaController] Erro ao LISTAR turmas:', error);
      next(error);
    }
  },

  findById: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    console.log(
      `[TurmaController] Recebida requisição para BUSCAR turma ID: ${req.params.id}`,
    );
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res.status(404).json({ message: 'Turma não encontrada.' });
      }
      const turma = await turmaService.findById(id, unidadeEscolarId);
      if (!turma) {
        return res.status(404).json({
          message:
            'Turma não encontrada ou não pertence a esta unidade escolar.',
        });
      }
      return res.status(200).json(turma);
    } catch (error) {
      console.error(
        `[TurmaController] Erro ao BUSCAR turma ID: ${req.params.id}`,
        error,
      );
      next(error);
    }
  },

  update: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    console.log(
      `[TurmaController] Recebida requisição para ATUALIZAR turma ID: ${req.params.id}`,
    );
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res
          .status(404)
          .json({ message: 'Turma não encontrada para atualizar.' });
      }
      const result = await turmaService.update(
        id,
        req.body as any,
        unidadeEscolarId,
      );
      if (result.count === 0)
        return res
          .status(404)
          .json({ message: 'Turma não encontrada para atualizar.' });
      return res.status(200).json({ message: 'Turma atualizada com sucesso.' });
    } catch (error) {
      console.error(
        `[TurmaController] Erro ao ATUALIZAR turma ID: ${req.params.id}`,
        error,
      );
      next(error);
    }
  },

  remove: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    console.log(
      `[TurmaController] Recebida requisição para DELETAR turma ID: ${req.params.id}`,
    );
    try {
      const { id } = req.params;
      const { unidadeEscolarId } = req.user;
      if (!unidadeEscolarId) {
        return res
          .status(404)
          .json({ message: 'Turma não encontrada para deletar.' });
      }

      console.log(
        `[TurmaController] Chamando turmaService.remove para o ID: ${id}`,
      );
      const result = await turmaService.remove(id, unidadeEscolarId);

      if (result.count === 0) {
        console.warn(
          `[TurmaController] Nenhuma turma encontrada com o ID: ${id} para deletar.`,
        );
        return res
          .status(404)
          .json({ message: 'Turma não encontrada para deletar.' });
      }

      console.log(`[TurmaController] Turma ID: ${id} deletada com sucesso.`);
      return res.status(204).send();
    } catch (error) {
      console.error(
        `[TurmaController] ERRO ao deletar turma ID: ${req.params.id}`,
        error,
      );
      next(error);
    }
  },

  findMatriculas: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const matriculas = await turmaService.findMatriculas(id);
      return res.status(200).json(matriculas);
    } catch (error) {
      next(error);
    }
  },
};
