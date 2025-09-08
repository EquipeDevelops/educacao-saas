import { Request, Response } from 'express';
import { z} from 'zod'; 
import prisma from '../utils/prisma'; 
import { ArquivoSchema } from '../validators/arquivoValidator';


export const ArquivosController = {
  async create(req: Request, res: Response) {
    try {
      const data = ArquivoSchema.parse(req.body);
      const arquivo = await prisma.arquivos.create({ data });
      return res.status(201).json(arquivo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao criar arquivo.' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const arquivos = await prisma.arquivos.findMany();
      return res.status(200).json(arquivos);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar arquivos.' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const arquivo = await prisma.arquivos.findUnique({ where: { id } });

      if (!arquivo) {
        return res.status(404).json({ error: 'Arquivo não encontrado.' });
      }
      return res.status(200).json(arquivo);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar arquivo.' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = ArquivoSchema.parse(req.body);
      const arquivo = await prisma.arquivos.update({
        where: { id },
        data,
      });
      return res.status(200).json(arquivo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao atualizar arquivo.' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.arquivos.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar arquivo.' });
    }
  },
};