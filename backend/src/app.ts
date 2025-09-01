import express, { Application, Request, Response } from "express";
import mainRouter from "./routes";

const app: Application = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("API da Plataforma Educacional está no ar!");
});

app.use("/api", mainRouter);

export default app;
