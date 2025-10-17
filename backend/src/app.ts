import express, { Application, Request, Response, NextFunction } from "express";
import { authRoutes, protectedRouter } from "./routes";
import { errorHandler } from "./middlewares/error";
import cors from "cors";
import { protect } from "./middlewares/auth";
import { prismaContextMiddleware } from "./middlewares/prisma-context";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(
    `\n[GLOBAL LOG] Recebida requisição: ${req.method} ${req.originalUrl}`
  );
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send("API da Plataforma Educacional está no ar!");
});

app.use("/api/auth", authRoutes);

app.use("/api", protect, prismaContextMiddleware, protectedRouter);

app.use(errorHandler);

export default app;
