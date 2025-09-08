import { Request, Response } from 'express';
import { z } from 'zod'; 
import prisma from '../utils/prisma'; 
import { UnidadesEscolaresSchema } from '../validators/unidadesEscolares';


export const UnidadesEscolaresController = {
  async create(req: Request, res: Response) {
    try {
      const data = UnidadesEscolaresSchema.parse(req.body);
      const unidadeEscolar = await prisma.unidadesEscolares.create({ data });
      return res.status(201).json(unidadeEscolar);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao criar unidade escolar.' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const unidades = await prisma.unidades_Escolares.findMany();
      return res.status(200).json(unidades);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar unidades escolares.' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = await prisma.unidades_Escolares.findUnique({ where: { id } });

      if (!unidade) {
        return res.status(404).json({ error: 'Unidade escolar não encontrada.' });
      }
      return res.status(200).json(unidade);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar unidade escolar.' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = UnidadesEscolaresSchema.parse(req.body);
      const unidade = await prisma.unidades_Escolares.update({
        where: { id },
        data,
      });
      return res.status(200).json(unidade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao atualizar unidade escolar.' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.unidades_Escolares.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar unidade escolar.' });
    }
  },
};