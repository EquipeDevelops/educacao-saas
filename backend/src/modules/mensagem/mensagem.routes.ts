import { Router } from "express";
import { mensagemController } from "./mensagem.controller";
import { validate } from "../../middlewares/validate";
import { protect } from "../../middlewares/auth";
import {
  createMensagemSchema,
  updateMensagemSchema,
  findAllMensagensSchema,
  mensagemParamsSchema,
} from "./mensagem.validator";

const router = Router();

router.post(
  "/conversa/:conversaId",
  protect,
  validate(createMensagemSchema),
  mensagemController.create
);
router.get(
  "/conversa/:conversaId",
  protect,
  validate(findAllMensagensSchema),
  mensagemController.findAllByConversa
);

router.put(
  "/:id",
  protect,
  validate(updateMensagemSchema),
  mensagemController.update
);
router.delete(
  "/:id",
  protect,
  validate({ params: mensagemParamsSchema }),
  mensagemController.remove
);

export const mensagemRoutes = router;
