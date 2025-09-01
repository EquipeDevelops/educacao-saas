import { Request, Response } from "express";
import { createInstituicaoSchema } from "../validators/instituicao.validator";
import {
  createInstituicao,
  getAllInstituicoes,
} from "../services/instituicao.service";

export const createInstituicaoController = async (
  req: Request,
  res: Response
) => {
  try {
    // 1. Validar os dados da requisição com o schema do Zod
    const { body } = createInstituicaoSchema.parse(req);

    // 2. Chamar o service para criar a instituição
    const instituicao = await createInstituicao(body);

    // 3. Enviar a resposta de sucesso
    return res.status(201).json({
      message: "Instituição criada com sucesso!",
      data: instituicao,
    });
  } catch (error) {
    // Se a validação do Zod falhar, ele gera um erro que é pego aqui
    console.error(error);
    return res.status(400).json({ error });
  }
};

export const getAllInstituicoesController = async (
  req: Request,
  res: Response
) => {
  try {
    // 1. Chamar o service para buscar as instituições
    const instituicoes = await getAllInstituicoes();

    // 2. Enviar a resposta de sucesso com os dados
    return res.status(200).json({
      data: instituicoes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar instituições." });
  }
};
