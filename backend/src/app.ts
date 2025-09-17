import "express-async-errors";
import express, { Application, Request, Response } from "express";
import mainRouter from "./routes";
import { errorHandler } from "./middlewares/error";

const app: Application = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("API da Plataforma Educacional está no ar!");
});

app.use("/api", mainRouter);

app.use(errorHandler);

export default app;
