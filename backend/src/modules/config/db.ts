import prisma from "../../utils/prisma";

export const connectDB = async () => {
  console.log("🔌 Conectando ao banco de dados via Prisma...");
  try {
    await prisma.$connect();
    console.log("✅ Banco de dados conectado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco de dados:", error);
    process.exit(1);
  }
};