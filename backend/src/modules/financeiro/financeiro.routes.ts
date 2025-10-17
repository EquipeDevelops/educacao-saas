import { Router } from "express";
import { financeiroController } from "./financeiro.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createPlanoSchema,
  updatePlanoSchema,
  createTransacaoSchema,
  processarPagamentoSchema,
  paramsSchema,
  gerarMensalidadesSchema,
} from "./financeiro.validator";

const router = Router();

router.use(protect, authorize("GESTOR"));

router.get("/planos", financeiroController.findAllPlanos);
router.post(
  "/planos",
  validate(createPlanoSchema),
  financeiroController.createPlano
);
router.put(
  "/planos/:id",
  validate(updatePlanoSchema),
  financeiroController.updatePlano
);
router.delete(
  "/planos/:id",
  validate(paramsSchema),
  financeiroController.deletePlano
);

router.get("/mensalidades", financeiroController.findAllMensalidades);
router.post(
  "/mensalidades/gerar",
  validate(gerarMensalidadesSchema),
  financeiroController.gerarMensalidades
);
router.post(
  "/mensalidades/:id/pagar",
  validate(processarPagamentoSchema),
  financeiroController.processarPagamentoMensalidade
);

router.get("/transacoes", financeiroController.findAllTransacoes);
router.post(
  "/transacoes",
  validate(createTransacaoSchema),
  financeiroController.createTransacao
);
router.delete(
  "/transacoes/:id",
  validate(paramsSchema),
  financeiroController.deleteTransacao
);

router.get(
  "/relatorios/fluxo-caixa",
  financeiroController.getRelatorioFluxoCaixa
);

router.get("/relatorios/detalhado", financeiroController.getRelatorioDetalhado);
export const financeiroRoutes = router;
