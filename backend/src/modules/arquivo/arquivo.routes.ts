import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { arquivoController } from "./arquivo.controller";
import { createArquivoSchema, paramsSchema } from "./arquivo.validator";
import { upload } from "../../middlewares/upload"; // Middleware para upload de arquivos

const router = Router();

// A rota de upload: o middleware 'upload' processa o arquivo ANTES do controller.
// 'arquivo' é o nome do campo no formulário (form-data).
router.post(
  "/",
  upload.single("arquivo"), // talvez usar Multer.
  validate(createArquivoSchema),
  arquivoController.create
);

router.get("/", arquivoController.findAll); // Requer ?instituicaoId=... ou ?usuarioId=...

router.get("/:id", validate(paramsSchema), arquivoController.findById);

router.delete("/:id", validate(paramsSchema), arquivoController.delete);

export const arquivoRoutes = router;
