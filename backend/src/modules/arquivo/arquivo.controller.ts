import { Request, Response } from "express";
import { arquivoService, ArquivoMetadata } from "./arquivo.service";
import { UpdateArquivoInput, ArquivoParams } from "./arquivo.validator";

export const arquivoController = {
  create: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo foi enviado." });
      }

      const { instituicaoId, usuarioId, metadados } = req.body;
      const { originalname, mimetype, size, key } = req.file as any;

      const arquivoData: ArquivoMetadata = {
        chave: key,
        nome: originalname,
        tipo_conteudo: mimetype,
        tamanho: size,
        instituicaoId,
        usuarioId,
        metadados,
      };

      const novoArquivo = await arquivoService.create(arquivoData);
      return res.status(201).json(novoArquivo);
    } catch (error: any) {
      return res.status(500).json({
        message: "Erro ao salvar metadados do arquivo.",
        error: error.message,
      });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const { instituicaoId, usuarioId } = req.query;
      const filters = {
        instituicaoId: instituicaoId as string | undefined,
        usuarioId: usuarioId as string | undefined,
      };
      const arquivos = await arquivoService.findAll(filters);
      return res.status(200).json(arquivos);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar arquivos." });
    }
  },

  findById: async (req: Request<ArquivoParams>, res: Response) => {
    try {
      const arquivo = await arquivoService.findById(req.params.id);
      if (!arquivo)
        return res.status(404).json({ message: "Arquivo não encontrado." });
      return res.status(200).json(arquivo);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar arquivo." });
    }
  },

  delete: async (req: Request<ArquivoParams>, res: Response) => {
    try {
      await arquivoService.delete(req.params.id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(404).json({
        message: error.message || "Arquivo não encontrado para exclusão.",
      });
    }
  },
};
