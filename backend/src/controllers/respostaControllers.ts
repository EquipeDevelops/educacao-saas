import { Request, Response } from 'express';
import { z} from 'zod'; 
import prisma from '../utils/prisma'; 
import { RespostasSubmissaoSchema } from '../validators/respostaSubmissaoValidator';

export const RespostasSubmissaoController = {
  async create(req: Request, res: Response) {
    try {
      const data = RespostasSubmissaoSchema.parse(req.body);
      const resposta = await prisma.respostas_Submissao.create({ data });
      return res.status(201).json(resposta);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao criar resposta de submissão.' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const respostas = await prisma.respostas_Submissao.findMany();
      return res.status(200).json(respostas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar respostas de submissão.' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resposta = await prisma.respostas_Submissao.findUnique({ where: { id } });

      if (!resposta) {
        return res.status(404).json({ error: 'Resposta de submissão não encontrada.' });
      }
      return res.status(200).json(resposta);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar resposta de submissão.' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = RespostasSubmissaoSchema.parse(req.body);
      const resposta = await prisma.respostas_Submissao.update({
        where: { id },
        data,
      });
      return res.status(200).json(resposta);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error});
      }
      return res.status(500).json({ error: 'Erro ao atualizar resposta de submissão.' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.respostas_Submissao.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar resposta de submissão.' });
    }
  },
};