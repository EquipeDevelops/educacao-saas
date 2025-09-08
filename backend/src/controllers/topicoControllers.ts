import { Request, Response } from 'express';
import { z } from 'zod'; 
import prisma from '../utils/prisma'; 
import { TopicoForumSchema } from '../validators/topicoForumValidators';




export const TopicoForumController = {
  async create(req: Request, res: Response) {
    try {
      const data = TopicoForumSchema.parse(req.body);
      const topico = await prisma.topico_Forum.create({ data });
      return res.status(201).json(topico);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao criar tópico de fórum.' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const topicos = await prisma.topico_Forum.findMany();
      return res.status(200).json(topicos);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar tópicos de fórum.' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const topico = await prisma.topico_Forum.findUnique({ where: { id } });

      if (!topico) {
        return res.status(404).json({ error: 'Tópico de fórum não encontrado.' });
      }
      return res.status(200).json(topico);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar tópico de fórum.' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = TopicoForumSchema.parse(req.body);
      const topico = await prisma.topico_Forum.update({
        where: { id },
        data,
      });
      return res.status(200).json(topico);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao atualizar tópico de fórum.' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.topico_Forum.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar tópico de fórum.' });
    }
  },
};