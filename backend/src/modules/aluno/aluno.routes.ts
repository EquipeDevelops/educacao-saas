import { Router } from 'express';
import { alunoController } from './aluno.controller';
import { protect, authorize } from '../../middlewares/auth';

const router = Router();

router.get('/', protect, authorize('GESTOR'), alunoController.findAll);

router.get(
  '/:id/boletim',
  protect,
  authorize('GESTOR', 'PROFESSOR', 'ALUNO', 'RESPONSAVEL'),
  alunoController.getBoletim,
);

router.post(
  '/:id/boletim/comentario',
  protect,
  authorize('PROFESSOR'),
  alunoController.saveComentario,
);

router.get(
  '/:id/boletim/pdf',
  protect,
  authorize('GESTOR', 'PROFESSOR', 'ALUNO', 'RESPONSAVEL'),
  alunoController.getBoletimPdf,
);

router.get(
  '/agenda',
  protect,
  authorize('ALUNO'),
  alunoController.getAgendaMensal,
);

router.get(
  '/profile/me',
  protect,
  authorize('ALUNO'),
  alunoController.getProfile,
);

router.get(
  '/:id',
  protect,
  authorize('GESTOR', 'PROFESSOR', 'ALUNO'),
  alunoController.findOne,
);

export const alunoRoutes = router;
