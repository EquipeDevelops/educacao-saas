import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { conquistaUsuarioController } from "./conquistaUsuario.controller";
import {
  awardConquistaSchema,
  paramsSchema,
} from "./conquistaUsuario.validator";

const router = Router();

router.post(
  "/",
  validate(awardConquistaSchema),
  conquistaUsuarioController.award
);
router.get("/", conquistaUsuarioController.findAll);
router.delete(
  "/:id",
  validate(paramsSchema),
  conquistaUsuarioController.revoke
);

export const conquistaUsuarioRoutes = router;
