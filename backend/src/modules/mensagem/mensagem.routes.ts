import { Router } from "express";
import { conversaController } from "./conversa.controller";
import { validate } from "../../middlewares/validate";
import { protect } from "../../middlewares/auth";
import { createConversaSchema, paramsSchema } from "./conversa.validator";
import { mensagemController } from "../mensagem/mensagem.controller";
import { createMensagemSchema } from "../mensagem/mensagem.validator";

const router = Router();

router.use(protect);

router.post(
  "/",
  validate(createConversaSchema),
  conversaController.findOrCreate
);

router.get("/", conversaController.findAllForUser);

router.get(
  "/:id",
  validate({ params: paramsSchema }),
  conversaController.findById
);

router.post(
  "/:conversaId/mensagens",
  validate(createMensagemSchema),
  mensagemController.create
);

export const conversaRoutes = router;
