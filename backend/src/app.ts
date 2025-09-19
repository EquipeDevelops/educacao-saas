import express, { Application, Request, Response } from "express";
import mainRouter from "./routes";
import { errorHandler } from "./middlewares/error";
import cors from "cors";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("API da Plataforma Educacional está no ar!");
});

app.use("/api", mainRouter);

app.use(errorHandler);

export default app;
