import { Request, Response } from 'express';
import { z} from 'zod'; 
import prisma from '../utils/prisma'; 
import { QuestoesSchema } from '../validators/questoesValidators';

export const QuestoesController = {
  async create(req: Request, res: Response) {
    try {
      const data = QuestoesSchema.parse(req.body);
      const questao = await prisma.questoes.create({ data });
      return res.status(201).json(questao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao criar questão.' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const questoes = await prisma.questoes.findMany();
      return res.status(200).json(questoes);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar questões.' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const questao = await prisma.questoes.findUnique({ where: { id } });

      if (!questao) {
        return res.status(404).json({ error: 'Questão não encontrada.' });
      }
      return res.status(200).json(questao);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar questão.' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = QuestoesSchema.parse(req.body);
      const questao = await prisma.questoes.update({
        where: { id },
        data,
      });
      return res.status(200).json(questao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao atualizar questão.' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.questoes.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar questão.' });
    }
  },
};