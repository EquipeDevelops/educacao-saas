import { Request, Response } from 'express';
import { z } from 'zod'; 
import prisma from '../utils/prisma'; 
import { TarefaSchema } from '../validators/tarefaValidator';


export const TarefaController = {
  async create(req: Request, res: Response) {
    try {
      const data = TarefaSchema.parse(req.body);
      const tarefa = await prisma.tarefas.create({ data });
      return res.status(201).json(tarefa);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao criar tarefa.' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const tarefas = await prisma.tarefas.findMany();
      return res.status(200).json(tarefas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar tarefas.' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tarefa = await prisma.tarefas.findUnique({ where: { id } });

      if (!tarefa) {
        return res.status(404).json({ error: 'Tarefa não encontrada.' });
      }
      return res.status(200).json(tarefa);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar tarefa.' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = TarefaSchema.parse(req.body);
      const tarefa = await prisma.tarefas.update({
        where: { id },
        data,
      });
      return res.status(200).json(tarefa);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.tarefas.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar tarefa.' });
    }
  },
};