import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { SubmissaoSchema } from '../validators/instituicao.validator';

const prisma = new PrismaClient();

export const SubmissaoController = {
  async create(req: Request, res: Response) {
    try {
      const data = SubmissaoSchema.parse(req.body);
      const submissao = await prisma.submissoes.create({ data });
      return res.status(201).json(submissao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ error: 'Erro ao criar submissão.' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const submissoes = await prisma.submissoes.findMany();
      return res.status(200).json(submissoes);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar submissões.' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const submissao = await prisma.submissoes.findUnique({ where: { id } });

      if (!submissao) {
        return res.status(404).json({ error: 'Submissão não encontrada.' });
      }
      return res.status(200).json(submissao);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar submissão.' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = SubmissaoSchema.parse(req.body);
      const submissao = await prisma.submissoes.update({
        where: { id },
        data,
      });
      return res.status(200).json(submissao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ error: 'Erro ao atualizar submissão.' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.submissoes.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar submissão.' });
    }
  },
};