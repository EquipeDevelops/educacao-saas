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

export const createDiarioSchema = z.object({
  body: z.object({
    data: dateString,
    componenteCurricularId: z
      .string({ required_error: "O componente curricular é obrigatório." })
      .min(1, "Selecione uma turma."),
    objetivos: z
      .array(
        z.object({
          codigo: z
            .string({ required_error: "Informe o código BNCC." })
            .min(3, "Informe o código BNCC."),
          descricao: z
            .string({ required_error: "Descreva a habilidade BNCC." })
            .min(10, "A descrição deve conter pelo menos 10 caracteres."),
          etapa: z
            .string()
            .trim()
            .max(10, "A etapa deve ter até 10 caracteres.")
            .optional()
            .nullable(),
          area: z
            .string()
            .trim()
            .max(80, "A área deve ter até 80 caracteres.")
            .optional()
            .nullable(),
        })
      )
      .min(1, "Selecione ao menos um objetivo da BNCC."),
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
});

export const listRegistrosSchema = z.object({
  query: z.object({
    componenteCurricularId: z
      .string({ required_error: "Informe o componente curricular." })
      .min(1),
  }),
});

export const listAlunosSchema = z.object({
  params: z.object({
    componenteId: z
      .string({ required_error: "Informe o componente curricular." })
      .min(1),
  }),
});

export const getRegistroSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Informe o diário." }).min(1),
  }),
});

export const atualizarPresencasSchema = z.object({
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
});

export const objetivosBnccSchema = z.object({
  query: z.object({
    componenteId: z
      .string({ required_error: "Informe o componente curricular." })
      .min(1),
  }),
});

export const listarFrequenciasSchema = z.object({
  query: z.object({
    componenteCurricularId: z
      .string({ required_error: "Informe o componente curricular." })
      .min(1),
  }),
});
