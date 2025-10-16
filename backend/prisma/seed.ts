import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando o processo de seed...");

  const superAdminEmail = "superadmin@saas.com";
  const superAdminPassword = "superadmin123";

  const superAdminExists = await prisma.usuarios.findUnique({
    where: { email: superAdminEmail },
  });

  if (superAdminExists) {
    console.log(
      `- O Super Admin com o email '${superAdminEmail}' já existe. Nenhuma ação necessária.`
    );
  } else {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    const newSuperAdmin = await prisma.usuarios.create({
      data: {
        nome: "Super Admin",
        email: superAdminEmail,
        senha_hash: hashedPassword,
        papel: "ADMINISTRADOR",
      },
    });
    console.log(
      `✅ Super Admin criado com sucesso! Email: ${newSuperAdmin.email}`
    );
  }
}

main()
  .catch((e) => {
    console.error("Ocorreu um erro durante o processo de seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Processo de seed finalizado.");
  });
