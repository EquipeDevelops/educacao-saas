import { Router } from 'express';
import { usuarioController } from './usuario.controller';
import { protect, authorize } from '../../middlewares/auth';
import multer from 'multer';
import { validate } from '../../middlewares/validate';
import { createUserSchema, updateUserSchema } from './usuario.validator';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/',
  authorize('GESTOR'),
  validate(createUserSchema),
  usuarioController.create,
);
router.get('/', authorize('GESTOR'), usuarioController.list);
router.get('/:id', usuarioController.getById);
router.put('/:id', validate(updateUserSchema), usuarioController.update);
router.delete('/:id', authorize('GESTOR'), usuarioController.delete);

router.post(
  '/importar/alunos',
  authorize('GESTOR'),
  upload.single('arquivo'),
  usuarioController.importarAlunos,
);

export { router as usuarioRoutes };
