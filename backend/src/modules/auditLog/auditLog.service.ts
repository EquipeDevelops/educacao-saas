// modules/auditLog/auditLog.service.ts

import { Prisma, PrismaClient, AcaoAudit } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

// TIPOS ... (mantenha as interfaces LogDetails e LogPayload)
interface LogDetails {
  [key: string]: any;
}

interface LogPayload {
  acao: AcaoAudit;
  entidade: string;
  entidadeId?: string;
  detalhes: LogDetails;
  autor: AuthenticatedRequest["user"];
}

// A função 'create' permanece a mesma
const create = async (payload: LogPayload) => {
  // ... (código da função create inalterado)
};

// A função 'findAll' permanece a mesma
const findAll = async (unidadeEscolarId: string, filters: any) => {
  // ... (código da função findAll inalterado)
};

/**
 * ESTA É A NOVA FUNÇÃO QUE CRIA UM PRISMA CLIENT COM O MIDDLEWARE DE AUDITORIA
 * Ele recebe o usuário da requisição para saber QUEM está fazendo a ação.
 */
export const getPrismaClientWithAudit = (
  user: AuthenticatedRequest["user"]
) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Executa a operação original primeiro
          const result = await query(args);

          // Ações que vamos auditar
          const actionsToAudit: Prisma.PrismaAction[] = [
            "create",
            "update",
            "delete",
            "upsert",
          ];

          if (
            model &&
            actionsToAudit.includes(operation as any) &&
            user.unidadeEscolarId
          ) {
            let acao: AcaoAudit | null = null;
            let entidadeId: string | undefined = undefined;
            let detalhes: any = {};

            switch (operation) {
              case "create":
                acao = "CREATE";
                entidadeId = (result as any).id;
                detalhes = args.data;
                break;

              case "update":
                acao = "UPDATE";
                entidadeId = (args as any).where.id;
                // Para updates, precisamos do estado anterior para um log completo,
                // mas por simplicidade inicial, vamos logar apenas a mudança.
                detalhes = { para: (args as any).data };
                break;

              case "delete":
                acao = "DELETE";
                entidadeId = (args as any).where.id;
                // O 'result' de um delete contém o objeto que foi deletado
                detalhes = { deletado: result };
                break;
            }

            if (acao) {
              await create({
                acao,
                entidade: model,
                entidadeId: entidadeId,
                detalhes: detalhes,
                autor: user,
              });
            }
          }

          return result;
        },
      },
    },
  });
};

export const auditLogService = {
  create,
  findAll,
};
