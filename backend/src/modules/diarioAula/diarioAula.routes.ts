import { Router } from 'express';
import { diarioAulaController } from './diarioAula.controller';
import { protect } from '../../middlewares/auth';

const router = Router();

router.use(protect);
router.get('/', diarioAulaController.getDiario);
router.post('/', diarioAulaController.upsertDiario);

export const diarioAulaRoutes = router;
