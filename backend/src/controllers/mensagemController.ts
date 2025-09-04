import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { MensagensForumSchema } from '../validators';

const prisma = new PrismaClient();

export const MensagensForumController = {
  async create(req: Request, res: Response) {
    try {
      const data = MensagensForumSchema.parse(req.body);
      const mensagem = await prisma.mensagens_Forum.create({ data });
      return res.status(201).json(mensagem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ error: 'Erro ao criar mensagem de fórum.' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const mensagens = await prisma.mensagens_Forum.findMany();
      return res.status(200).json(mensagens);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar mensagens de fórum.' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const mensagem = await prisma.mensagens_Forum.findUnique({ where: { id } });

      if (!mensagem) {
        return res.status(404).json({ error: 'Mensagem de fórum não encontrada.' });
      }
      return res.status(200).json(mensagem);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar mensagem de fórum.' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = MensagensForumSchema.parse(req.body);
      const mensagem = await prisma.mensagens_Forum.update({
        where: { id },
        data,
      });
      return res.status(200).json(mensagem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ error: 'Erro ao atualizar mensagem de fórum.' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.mensagens_Forum.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar mensagem de fórum.' });
    }
  },
};