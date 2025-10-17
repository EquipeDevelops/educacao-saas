import { PrismaClient, StatusPagamento, TipoTransacao } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const prisma = new PrismaClient();

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export const financeiroService = {
  findAllPlanos: async (user: AuthenticatedRequest["user"]) => {
    return prisma.plano.findMany({
      where: { unidadeEscolarId: user.unidadeEscolarId! },
      orderBy: { nome: "asc" },
    });
  },

  createPlano: async (
    data: { nome: string; valor: number; descricao?: string },
    user: AuthenticatedRequest["user"],
    prismaClient: PrismaTransactionClient = prisma
  ) => {
    return prismaClient.plano.create({
      data: {
        ...data,
        unidadeEscolarId: user.unidadeEscolarId!,
      },
    });
  },

  updatePlano: async (
    id: string,
    data: { nome?: string; valor?: number; descricao?: string },
    user: AuthenticatedRequest["user"],
    prismaClient: PrismaTransactionClient = prisma
  ) => {
    return prismaClient.plano.updateMany({
      where: { id, unidadeEscolarId: user.unidadeEscolarId! },
      data,
    });
  },

  deletePlano: async (
    id: string,
    user: AuthenticatedRequest["user"],
    prismaClient: PrismaTransactionClient = prisma
  ) => {
    return prismaClient.plano.deleteMany({
      where: { id, unidadeEscolarId: user.unidadeEscolarId! },
    });
  },

  findAllMensalidades: async (
    user: AuthenticatedRequest["user"],
    filters: { status?: StatusPagamento; mes?: string; ano?: string }
  ) => {
    const where: any = { unidadeEscolarId: user.unidadeEscolarId! };
    if (filters.status) where.status = filters.status;
    if (filters.mes) where.mes = parseInt(filters.mes);
    if (filters.ano) where.ano = parseInt(filters.ano);

    return prisma.mensalidade.findMany({
      where,
      include: {
        matricula: { include: { aluno: { include: { usuario: true } } } },
        plano: true,
      },
      orderBy: { dataVencimento: "desc" },
    });
  },

  gerarMensalidades: async (
    user: AuthenticatedRequest["user"],
    {
      mes,
      ano,
      planoId,
      turmaId,
    }: { mes: number; ano: number; planoId: string; turmaId: string },
    prismaClient: PrismaTransactionClient = prisma
  ) => {
    const plano = await prismaClient.plano.findFirst({
      where: { id: planoId, unidadeEscolarId: user.unidadeEscolarId! },
    });
    if (!plano) throw new Error("Plano não encontrado.");

    const matriculasParaGerar = await prismaClient.matriculas.findMany({
      where: {
        turmaId: turmaId,
        status: "ATIVA",
        ano_letivo: ano,
        mensalidade: {
          none: {
            ano: ano,
            mes: mes,
          },
        },
      },
    });

    if (matriculasParaGerar.length === 0) {
      throw new Error(
        "Todas as mensalidades para este período e turma já foram geradas ou não há alunos ativos."
      );
    }

    const dataVencimento = new Date(ano, mes - 1, 10);

    const mensalidadesData = matriculasParaGerar.map((matricula) => ({
      matriculaId: matricula.id,
      planoId: plano.id,
      ano: ano,
      mes: mes,
      valor: plano.valor,
      dataVencimento: dataVencimento,
      unidadeEscolarId: user.unidadeEscolarId!,
    }));

    return prismaClient.mensalidade.createMany({
      data: mensalidadesData,
    });
  },

  processarPagamentoMensalidade: async (
    id: string,
    data: { metodo: string; valorPago: number },
    user: AuthenticatedRequest["user"],
    prismaClient: PrismaTransactionClient = prisma
  ) => {
    return prismaClient.$transaction(async (tx) => {
      const mensalidade = await tx.mensalidade.update({
        where: { id },
        data: {
          status: "PAGO",
          dataPagamento: new Date(),
        },
        include: {
          matricula: {
            include: {
              aluno: {
                include: {
                  usuario: true,
                },
              },
            },
          },
        },
      });

      const transacao = await tx.transacao.create({
        data: {
          descricao: `Pagamento mensalidade: ${mensalidade.matricula.aluno.usuario.nome} - ${mensalidade.mes}/${mensalidade.ano}`,
          valor: data.valorPago,
          tipo: "RECEITA",
          data: new Date(),
          unidadeEscolarId: user.unidadeEscolarId!,
        },
      });

      return tx.pagamento.create({
        data: {
          mensalidadeId: id,
          transacaoId: transacao.id,
          valorPago: data.valorPago,
          dataPagamento: new Date(),
          metodo: data.metodo,
          gatewayId: `sim_${new Date().getTime()}`,
        },
      });
    });
  },

  findAllTransacoes: async (
    user: AuthenticatedRequest["user"],
    filters: { tipo?: TipoTransacao }
  ) => {
    const where: any = { unidadeEscolarId: user.unidadeEscolarId! };
    if (filters.tipo) where.tipo = filters.tipo;

    return prisma.transacao.findMany({
      where,
      include: { categoria: true },
      orderBy: { data: "desc" },
    });
  },

  createTransacao: async (
    data: {
      descricao: string;
      valor: number;
      tipo: TipoTransacao;
      data: Date;
      status?: any;
      fornecedor?: string;
      categoriaId?: string;
    },
    user: AuthenticatedRequest["user"],
    prismaClient: PrismaTransactionClient = prisma
  ) => {
    return prismaClient.transacao.create({
      data: {
        ...data,
        unidadeEscolarId: user.unidadeEscolarId!,
      },
    });
  },

  deleteTransacao: async (
    id: string,
    user: AuthenticatedRequest["user"],
    prismaClient: PrismaTransactionClient = prisma
  ) => {
    return prismaClient.transacao.deleteMany({
      where: { id, unidadeEscolarId: user.unidadeEscolarId! },
    });
  },

  getRelatorioFluxoCaixa: async (
    user: AuthenticatedRequest["user"],
    filters: { dataInicio: string; dataFim: string }
  ) => {
    const where: any = {
      unidadeEscolarId: user.unidadeEscolarId!,
      data: {
        gte: new Date(filters.dataInicio),
        lte: new Date(filters.dataFim),
      },
    };

    const [receitas, despesas] = await Promise.all([
      prisma.transacao.aggregate({
        _sum: { valor: true },
        where: { ...where, tipo: "RECEITA" },
      }),
      prisma.transacao.aggregate({
        _sum: { valor: true },
        where: { ...where, tipo: "DESPESA" },
      }),
    ]);

    return {
      totalReceitas: receitas._sum.valor || 0,
      totalDespesas: despesas._sum.valor || 0,
      saldo: (receitas._sum.valor || 0) - (despesas._sum.valor || 0),
    };
  },

  getRelatorioDetalhado: async (
    user: AuthenticatedRequest["user"],
    filters: { dataInicio: string; dataFim: string }
  ) => {
    if (!user.unidadeEscolarId) {
      throw new Error("Usuário não vinculado a uma unidade escolar.");
    }

    const whereClause = {
      unidadeEscolarId: user.unidadeEscolarId,
      data: {
        gte: new Date(filters.dataInicio),
        lte: new Date(new Date(filters.dataFim).setHours(23, 59, 59, 999)),
      },
    };

    const transacoes = await prisma.transacao.findMany({
      where: whereClause,
      include: {
        categoria: true,
      },
      orderBy: {
        data: "desc",
      },
    });

    const fluxoMensal = transacoes.reduce((acc, t) => {
      const mesAno = format(t.data, "yyyy-MM");
      if (!acc[mesAno]) {
        acc[mesAno] = {
          mes: format(t.data, "MMM/yy", { locale: ptBR }),
          receitas: 0,
          despesas: 0,
        };
      }
      if (t.tipo === "RECEITA") {
        acc[mesAno].receitas += t.valor;
      } else {
        acc[mesAno].despesas += t.valor;
      }
      return acc;
    }, {} as Record<string, { mes: string; receitas: number; despesas: number }>);

    const despesasPorCategoria = transacoes
      .filter((t) => t.tipo === "DESPESA" && t.categoria)
      .reduce((acc, t) => {
        const nomeCategoria = t.categoria!.nome;
        acc[nomeCategoria] = (acc[nomeCategoria] || 0) + t.valor;
        return acc;
      }, {} as Record<string, number>);

    const graficoPizza = Object.entries(despesasPorCategoria).map(
      ([name, value]) => ({ name, value })
    );

    const totais = transacoes.reduce(
      (acc, t) => {
        if (t.tipo === "RECEITA") acc.receitas += t.valor;
        else acc.despesas += t.valor;
        return acc;
      },
      { receitas: 0, despesas: 0 }
    );

    return {
      transacoes: transacoes,
      despesasPorCategoria: graficoPizza,
      fluxoCaixaMensal: Object.values(fluxoMensal).sort((a, b) =>
        a.mes.localeCompare(b.mes, "pt-BR", { numeric: true })
      ),
      totais,
    };
  },
};
