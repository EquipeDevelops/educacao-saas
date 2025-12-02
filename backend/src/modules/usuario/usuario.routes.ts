import { Router } from "express";
import { usuarioController } from "./usuario.controller";
import { authorize } from "../../middlewares/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { validate } from "../../middlewares/validate";
import { createUserSchema, updateUserSchema } from "./usuario.validator";

const router = Router();

const uploadDir = path.resolve(__dirname, "..", "..", "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.use(authorize("GESTOR"));

router.post(
  "/",
  upload.single("foto"),
  (req, res, next) => {
    if (req.body.data) {
      Object.assign(req.body, JSON.parse(req.body.data));
    }
    next();
  },
  validate(createUserSchema),
  usuarioController.create
);

router.get("/", usuarioController.list);
router.get("/:id", usuarioController.getById);

router.put(
  "/:id",
  upload.single("foto"),
  (req, res, next) => {
    if (req.body.data) {
      Object.assign(req.body, JSON.parse(req.body.data));
    }
    next();
  },
  validate(updateUserSchema),
  usuarioController.update
);

router.delete("/:id", usuarioController.delete);

router.post(
  "/importar/alunos",
  multer({ storage: multer.memoryStorage() }).single("arquivo"),
  usuarioController.importarAlunos
);

export { router as usuarioRoutes };