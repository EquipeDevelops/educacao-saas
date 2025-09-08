import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import prisma from '../utils/prisma';
import { MatriculasSchema } from '../validators/matriculaValidators'; 

export const MatriculasController = {

  async create(req: Request, res: Response) {
    try {
      const data = MatriculasSchema.parse(req.body);
      const matricula = await prisma.matriculas.create({ data });
      return res.status(201).json(matricula);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao criar a matrícula.' });
    }
  },

  // Busca todas as matrículas
  async findAll(req: Request, res: Response) {
    try {
      const matriculas = await prisma.matriculas.findMany();
      return res.status(200).json(matriculas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar as matrículas.' });
    }
  },

  // Busca uma matrícula por ID
  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const matricula = await prisma.matriculas.findUnique({ where: { id } });

      if (!matricula) {
        return res.status(404).json({ error: 'Matrícula não encontrada.' });
      }
      return res.status(200).json(matricula);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar a matrícula.' });
    }
  },

  
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = MatriculasSchema.parse(req.body);
      const matricula = await prisma.matriculas.update({
        where: { id },
        data,
      });
      return res.status(200).json(matricula);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao atualizar a matrícula.' });
    }
  },

  
  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.matriculas.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar a matrícula.' });
    }
  },
};