import { z } from "zod";

const dateString = z
  .string({ required_error: "A data é obrigatória." })
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Data inválida.",
  })
  .refine((value) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(value);
    selected.setHours(0, 0, 0, 0);
    return selected <= today;
  }, "A data não pode estar no futuro.");

export const createDiarioSchema = {
  body: z.object({
    data: dateString,
    componenteCurricularId: z
      .string({ required_error: "O componente curricular é obrigatório." })
      .min(1, "Selecione uma turma."),
    objetivoCodigo: z
      .string({ required_error: "O código BNCC é obrigatório." })
      .min(3, "Informe o código BNCC."),
    objetivoDescricao: z
      .string({ required_error: "A descrição do objetivo é obrigatória." })
      .min(10, "A descrição deve conter pelo menos 10 caracteres."),
    tema: z
      .string({ required_error: "O tema ou saber é obrigatório." })
      .min(3, "Descreva o tema desenvolvido."),
    atividade: z
      .string({ required_error: "A atividade é obrigatória." })
      .min(5, "Detalhe a atividade desenvolvida."),
    observacoes: z
      .string()
      .max(500, "As observações podem ter no máximo 500 caracteres.")
      .optional(),
  }),
};

export const listRegistrosSchema = {
  query: z.object({
    componenteCurricularId: z
      .string({ required_error: "Informe o componente curricular." })
      .min(1),
  }),
};

export const listAlunosSchema = {
  params: z.object({
    componenteId: z
      .string({ required_error: "Informe o componente curricular." })
      .min(1),
  }),
};

export const getRegistroSchema = {
  params: z.object({
    id: z.string({ required_error: "Informe o diário." }).min(1),
  }),
};

export const atualizarPresencasSchema = {
  params: z.object({
    id: z.string({ required_error: "Informe o diário." }).min(1),
  }),
  body: z.object({
    registros: z
      .array(
        z.object({
          matriculaId: z
            .string({ required_error: "Informe a matrícula." })
            .min(1),
          situacao: z.enum(["PRESENTE", "FALTA", "FALTA_JUSTIFICADA"]),
          observacao: z
            .string()
            .max(250, "A observação pode ter no máximo 250 caracteres.")
            .optional(),
        })
      )
      .min(1, "Informe ao menos um aluno."),
  }),
};

export const objetivosBnccSchema = {
  query: z.object({
    componenteId: z
      .string({ required_error: "Informe o componente curricular." })
      .min(1),
  }),
};
