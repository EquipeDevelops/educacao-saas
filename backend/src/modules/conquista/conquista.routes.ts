import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { conquistaController } from "./conquista.controller";
import {
  createConquistaSchema,
  updateConquistaSchema,
  paramsSchema,
} from "./conquista.validator";

const router = Router();

router.post("/", validate(createConquistaSchema), conquistaController.create);
router.get("/", conquistaController.findAll);
router.get("/:id", validate(paramsSchema), conquistaController.findById);
router.patch(
  "/:id",
  validate(updateConquistaSchema),
  conquistaController.update
);
router.delete("/:id", validate(paramsSchema), conquistaController.delete);

export const conquistaRoutes = router;
