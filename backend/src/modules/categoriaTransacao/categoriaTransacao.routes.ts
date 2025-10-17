import { Router } from "express";
import { categoriaController } from "./categoriaTransacao.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createCategoriaSchema,
  paramsSchema,
} from "./categoriaTransacao.validator";

const router = Router();
router.use(protect, authorize("GESTOR"));

router.get("/", categoriaController.findAll);
router.post("/", validate(createCategoriaSchema), categoriaController.create);
router.delete("/:id", validate(paramsSchema), categoriaController.delete);

export const categoriaTransacaoRoutes = router;
