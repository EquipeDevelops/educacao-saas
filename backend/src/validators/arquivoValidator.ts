import { z } from 'zod';

export const ArquivoSchema = z.object({
  nome: z.string().min(1, 'O nome do arquivo é obrigatório.'),
 
  tipo: z.string().min(1, 'O tipo do arquivo é obrigatório.'),

  conteudo: z.string().min(1, 'O conteúdo do arquivo é obrigatório.'),
});