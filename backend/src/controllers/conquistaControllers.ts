import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import prisma from '../utils/prisma';
import { ConquistasSchema } from '../validators/conquistasValidators';

export const ConquistasController = {
  async create(req: Request, res: Response) {
    try {
      const data = ConquistasSchema.parse(req.body);
      const conquista = await prisma.conquistas.create({ data });
      return res.status(201).json(conquista);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao criar a conquista.' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const conquistas = await prisma.conquistas.findMany();
      return res.status(200).json(conquistas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar as conquistas.' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const conquista = await prisma.conquistas.findUnique({ where: { id } });

      if (!conquista) {
        return res.status(404).json({ error: 'Conquista não encontrada.' });
      }
      return res.status(200).json(conquista);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar a conquista.' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = ConquistasSchema.parse(req.body);
      const conquista = await prisma.conquistas.update({
        where: { id },
        data,
      });
      return res.status(200).json(conquista);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: error});
      }
      return res.status(500).json({ error: 'Erro ao atualizar a conquista.' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.conquistas.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar a conquista.' });
    }
  },
};