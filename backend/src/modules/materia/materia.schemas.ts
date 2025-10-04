// NOVO ARQUIVO: src/schemas/materia.schemas.ts (Ajuste o caminho conforme seu projeto)

import { z } from 'zod';

// Esquema para validar o ID na URL
export const paramsSchema = z.object({
    id: z.string().nonempty("O ID da matéria é obrigatório."),
    // Recomendo adicionar .uuid() se seus IDs forem UUIDs.
});

// Esquema WRAPPER que o middleware 'validate' espera (inclui body, query e params)
export const materiaDeleteSchema = z.object({
    params: paramsSchema, 
    
    // Body e Query são opcionais/vazios na rota DELETE, mas o middleware exige as chaves.
    body: z.any().optional(),
    query: z.any().optional(),
});