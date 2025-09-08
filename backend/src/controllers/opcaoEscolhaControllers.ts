import { Request, Response } from 'express';
import { z, ZodError } from 'zod'; 
import prisma from '../utils/prisma'; 
import { OpcoesMultiplaEscolhaSchema } from '../validators/opcaoesEscolhasValidators';

export const OpcoesMultiplaEscolhaController = {
  async create(req: Request, res: Response) {
    try {
      const data = OpcoesMultiplaEscolhaSchema.parse(req.body);
      const opcao = await prisma.opcoesMultiplaEscolhaSchema.create({ data });
      return res.status(201).json(opcao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao criar opção de múltipla escolha.' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const opcoes = await prisma.opcoesMultiplaEscolhaSchema.findMany();
      return res.status(200).json(opcoes);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar opções de múltipla escolha.' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const opcao = await prisma.opcoes_Multipla_Escolha.findUnique({ where: { id } });

      if (!opcao) {
        return res.status(404).json({ error: 'Opção de múltipla escolha não encontrada.' });
      }
      return res.status(200).json(opcao);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar opção de múltipla escolha.' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = OpcoesMultiplaEscolhaSchema.parse(req.body);
      const opcao = await prisma.opcoes_Multipla_Escolha.update({
        where: { id },
        data,
      });
      return res.status(200).json(opcao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
      }
      return res.status(500).json({ error: 'Erro ao atualizar opção de múltipla escolha.' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.opcoes_Multipla_Escolha.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar opção de múltipla escolha.' });
    }
  },
};