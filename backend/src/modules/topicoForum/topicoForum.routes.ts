import { Router } from "express";
import { validate } from "../../middlewares/validate";

import { topicoController } from "./topicoForum.controller";
import {
  createTopicoSchema,
  updateTopicoSchema,
  paramsSchema,
} from "./topicoForum.validator";

import { mensagemController } from "../mensagemForum/mensagemForum.controller";
import {
  createMensagemSchema,
  paramsSchema as mensagemParamsSchema,
} from "../mensagemForum/mensagemForum.validator";

const router = Router();

router.post("/", validate(createTopicoSchema), topicoController.create);
router.get("/", topicoController.findAll);
router.get("/:id", validate(paramsSchema), topicoController.findById);
router.patch("/:id", validate(updateTopicoSchema), topicoController.update);
router.delete("/:id", validate(paramsSchema), topicoController.delete);

router.post(
  "/:topicoId/mensagens",
  validate(createMensagemSchema),
  mensagemController.create
);

router.get(
  "/:topicoId/mensagens",
  validate(mensagemParamsSchema),
  mensagemController.findAllByTopico
);

export const topicoRoutes = router;
