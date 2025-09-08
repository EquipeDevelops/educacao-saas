import { Request, Response } from 'express';
import { z, ZodError } from 'zod'; 
import prisma from '../utils/prisma'; 
import { TurmaSchema } from '../validators/turmaValidator';

export const TurmaController = {
  async create(req: Request, res: Response) {
    try {
      const data = TurmaSchema.parse(req.body);
      const turma = await prisma.turma.create({ data });
      return res.status(201).json(turma);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: error});
      }
      return res.status(500).json({ error: 'Erro ao criar turma.' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const turmas = await prisma.turmas.findMany();
      return res.status(200).json(turmas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar turmas.' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const turma = await prisma.turmas.findUnique({ where: { id } });

      if (!turma) {
        return res.status(404).json({ error: 'Turma não encontrada.' });
      }
      return res.status(200).json(turma);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar turma.' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = TurmaSchema.parse(req.body);
      const turma = await prisma.turmas.update({
        where: { id },
        data,
      });
      return res.status(200).json(turma);
    } catch (error) {
      if (error instanceof ZodError) { 
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao atualizar turma.' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.turmas.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar turma.' });
    }
  },
};