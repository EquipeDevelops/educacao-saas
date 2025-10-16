import prisma from "../../utils/prisma";
import { UpdateArquivoInput } from "./arquivo.validator";

export interface ArquivoMetadata {
  chave: string;
  nome: string;
  tipo_conteudo: string;
  tamanho: number;
  instituicaoId: string;
  usuarioId: string;
  metadados?: any;
}

export const arquivoService = {
  create: async (data: ArquivoMetadata) => {
    return await prisma.arquivos.create({ data });
  },

  findAll: async (filters: { instituicaoId?: string; usuarioId?: string }) => {
    return await prisma.arquivos.findMany({
      where: filters,
      orderBy: { criado_em: "desc" },
    });
  },

  findById: async (id: string) => {
    return await prisma.arquivos.findUnique({ where: { id } });
  },

  update: async (id: string, data: UpdateArquivoInput) => {
    return await prisma.arquivos.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    const arquivo = await prisma.arquivos.findUnique({ where: { id } });
    if (!arquivo) {
      throw new Error("Arquivo não encontrado no banco de dados.");
    }

    // **LÓGICA IMPORTANTE PARA PRODUÇÃO**
    // 1. Deletar o arquivo do serviço de armazenamento (ex: AWS S3, Google Cloud Storage)
    // Ex: await deleteFromS3(arquivo.chave);

    // 2. Se a exclusão no armazenamento for bem-sucedida, deletar do banco

    return await prisma.arquivos.delete({ where: { id } });
  },
};
