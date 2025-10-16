import { Prisma, PrismaClient, AcaoAudit } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

interface LogDetails {
  [key: string]: any;
}

interface LogPayload {
  acao: AcaoAudit;
  entidade: string;
  entidadeId?: string;
  detalhes: LogDetails;
  autorId: string;
  autorNome: string;
  unidadeEscolarId: string;
}

const create = async (payload: LogPayload) => {
  return prisma.auditLog.create({
    data: {
      acao: payload.acao,
      entidade: payload.entidade,
      entidadeId: payload.entidadeId,
      detalhes: payload.detalhes,
      autorId: payload.autorId,
      autorNome: payload.autorNome,
      unidadeEscolarId: payload.unidadeEscolarId,
    },
  });
};

const findAll = async (unidadeEscolarId: string, filters: any) => {
  const where: Prisma.AuditLogWhereInput = {
    unidadeEscolarId,
  };

  if (filters.entidade) {
    where.entidade = { equals: filters.entidade, mode: "insensitive" };
  }
  if (filters.dataInicio) {
    where.timestamp = { ...where.timestamp, gte: new Date(filters.dataInicio) };
  }
  if (filters.dataFim) {
    where.timestamp = { ...where.timestamp, lte: new Date(filters.dataFim) };
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: {
      timestamp: "desc",
    },
    take: 100,
  });

  return logs;
};

export const getPrismaClientWithAudit = (
  user: AuthenticatedRequest["user"] & { nome?: string }
) => {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const actionsToAudit: Prisma.PrismaAction[] = [
            "create",
            "update",
            "delete",
            "upsert",
          ];

          if (model === "AuditLog" || !model) {
            return query(args);
          }

          if (
            !actionsToAudit.includes(operation as any) ||
            !user.unidadeEscolarId
          ) {
            return query(args);
          }

          let originalRecord: any = null;
          if (operation === "update" || operation === "delete") {
            originalRecord = await (prisma as any)[model].findUnique({
              where: (args as any).where,
            });
          }

          const result = await query(args);

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
              detalhes = { de: originalRecord, para: (args as any).data };
              break;
            case "delete":
              acao = "DELETE";
              entidadeId = (args as any).where.id;
              detalhes = originalRecord;
              break;
          }

          if (acao && entidadeId && user.nome) {
            await create({
              acao,
              entidade: model,
              entidadeId: entidadeId,
              detalhes: detalhes,
              autorId: user.id,
              autorNome: user.nome,
              unidadeEscolarId: user.unidadeEscolarId,
            });
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
