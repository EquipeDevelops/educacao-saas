import { Router } from 'express';
import { avaliacaoController } from './avaliacaoParcial.controller';
import { validate } from '../../middlewares/validate';
import { protect, authorize } from '../../middlewares/auth';
import { z } from 'zod';
import {
  createAvaliacaoSchema,
  updateAvaliacaoSchema,
  paramsSchema,
  findAllAvaliacoesSchema,
} from './avaliacaoParcial.validator';

const router = Router();

router.post(
  '/',
  protect,
  authorize('PROFESSOR'),
  validate(createAvaliacaoSchema),
  avaliacaoController.create,
);
router.put(
  '/:id',
  protect,
  authorize('PROFESSOR'),
  validate(updateAvaliacaoSchema),
  avaliacaoController.update,
);
router.delete(
  '/:id',
  protect,
  authorize('PROFESSOR'),
  validate(z.object({ params: paramsSchema })),
  avaliacaoController.remove,
);

router.get(
  '/',
  protect,
  authorize('GESTOR', 'PROFESSOR', 'ALUNO'),
  validate(findAllAvaliacoesSchema),
  avaliacaoController.findAll,
);
router.get(
  '/:id',
  protect,
  authorize('GESTOR', 'PROFESSOR', 'ALUNO'),
  validate(z.object({ params: paramsSchema })),
  avaliacaoController.findById,
);

export const avaliacaoRoutes = router;
