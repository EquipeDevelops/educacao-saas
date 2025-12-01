import { Router, NextFunction, Request, Response } from "express";
import { tarefaController } from "./tarefa.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import { z } from "zod";
import multer from "multer";
import {
  createTarefaSchema,
  updateTarefaSchema,
  paramsSchema,
  findAllTarefasSchema,
  publishTarefaSchema,
  deleteTarefaSchema,
  trabalhoCorrecaoParamsSchema,
  trabalhoManualGradeSchema,
} from "./tarefa.validator";

const router = Router();

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      new Error(
        "Tipo de arquivo não suportado. Envie apenas PDF, Word ou PowerPoint."
      )
    );
  },
});

const uploadAnexos = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.array("anexos", 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    return next();
  });
};

router.post(
  "/",
  protect,
  authorize("PROFESSOR"),
  validate(createTarefaSchema),
  tarefaController.create
);

router.put(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate(updateTarefaSchema),
  tarefaController.update
);
router.delete(
  "/:id",
  protect,
  authorize("PROFESSOR"),
  validate(deleteTarefaSchema),
  tarefaController.remove
);
router.patch(
  "/:id/publish",
  protect,
  authorize("PROFESSOR"),
  validate(publishTarefaSchema),
  tarefaController.publish
);

router.get(
  "/",
  protect,
  authorize("ADMINISTRADOR", "GESTOR", "PROFESSOR", "ALUNO"),
  validate(findAllTarefasSchema),
  tarefaController.findAll
);

router.get(
  "/:id",
  protect,
  authorize("ADMINISTRADOR", "GESTOR", "PROFESSOR", "ALUNO"),
  validate(z.object({ params: paramsSchema })),
  tarefaController.findById
);

router.post(
  "/:id/anexos",
  protect,
  authorize("PROFESSOR"),
  validate(z.object({ params: paramsSchema })),
  uploadAnexos,
  tarefaController.uploadAttachments
);

router.get(
  "/:id/trabalhos/avaliacoes",
  protect,
  authorize("PROFESSOR"),
  validate(trabalhoCorrecaoParamsSchema),
  tarefaController.getTrabalhoCorrecaoResumo
);

router.post(
  "/:id/trabalhos/avaliacoes",
  protect,
  authorize("PROFESSOR"),
  validate(trabalhoManualGradeSchema),
  tarefaController.gradeTrabalhoAluno
);

export const tarefaRoutes = router;
