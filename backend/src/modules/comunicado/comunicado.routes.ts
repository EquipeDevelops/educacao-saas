import { Router } from 'express';
import { comunicadoController } from './comunicado.controller';
import { authorize, protect } from '../../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { validate } from '../../middlewares/validate';
import {
  createComunicadoSchema,
  updateComunicadoSchema,
} from './comunicado.validator';

const router = Router();

const uploadDir = path.resolve(__dirname, '..', '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.use(protect);
router.use(authorize('GESTOR'));

router.post(
  '/',
  upload.array('imagens', 10),
  (req, res, next) => {
    if (req.body.data) {
      Object.assign(req.body, JSON.parse(req.body.data));
      delete req.body.data;
    }
    next();
  },
  validate(createComunicadoSchema),
  comunicadoController.create,
);

router.get('/', comunicadoController.findAll);

router.put(
  '/:id',
  upload.array('imagens', 10),
  (req, res, next) => {
    if (req.body.data) {
      Object.assign(req.body, JSON.parse(req.body.data));
      delete req.body.data;
    }
    next();
  },
  validate(updateComunicadoSchema),
  comunicadoController.update,
);

router.delete('/:id', comunicadoController.delete);

export const comunicadoRoutes = router;
