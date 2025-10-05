import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middlewares/validate";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validator";

const router = Router();

// ARQUITETURA: Estas rotas são públicas e NÃO usam o middleware 'protect'.
router.post("/login", validate(loginSchema), authController.login);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.patch(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  authController.resetPassword
);

export const authRoutes = router;
