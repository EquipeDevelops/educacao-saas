import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth";
import { geradorProvaIAController } from "./geradorProvaIA.controller";
import { z } from "zod";
import { validate } from "../../middlewares/validate";

const router = Router();

const gerarProvaSchema = z.object({
  body: z.object({
    prompt: z.string({ required_error: "O prompt é obrigatório." }).min(10),
  }),
});

router.post(
  "/",
  protect,
  authorize("PROFESSOR"),
  validate(gerarProvaSchema),
  geradorProvaIAController.create
);

router.post(
  "/gerar-questoes",
  protect,
  authorize("PROFESSOR"),
  validate(gerarProvaSchema),
  geradorProvaIAController.gerarQuestoes
);

export const geradorProvaIARoutes = router;
