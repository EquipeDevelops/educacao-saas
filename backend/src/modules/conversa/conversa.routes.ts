import { Router } from "express";
import { conversaController } from "./conversa.controller";
import { validate } from "../../middlewares/validate";
import { protect } from "../../middlewares/auth"; // <-- IMPORTAÇÃO
import { createConversaSchema, paramsSchema } from "./conversa.validator";

const router = Router();

// SEGURANÇA: Todas as rotas de conversa exigem que o usuário esteja autenticado.
router.post(
  "/",
  protect,
  validate(createConversaSchema),
  conversaController.findOrCreate
);

router.get("/", protect, conversaController.findAllForUser);

router.get(
  "/:id",
  protect,
  validate({ params: paramsSchema }),
  conversaController.findById
);

export const conversaRoutes = router;
