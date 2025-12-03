import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./modules/config/db";

console.log("Valor da JWT_SECRET:", process.env.JWT_SECRET);
const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Falha ao iniciar o servidor", error);
    process.exit(1);
  }
};

startServer();