import { Response } from "express";
import { comentarioService } from "./comentarioTarefa.service";
import { AuthenticatedRequest } from "../../middlewares/auth"; // <-- IMPORTA O TIPO
import { CreateComentarioInput } from "./comentarioTarefa.validator";

export const comentarioController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { user } = req; // <-- USA O DADO REAL E SEGURO
      // O 'autorId' e 'instituicaoId' são adicionados ao body para o serviço criar o registro
      const comentarioData = {
        ...req.body,
        autorId: user.id,
        instituicaoId: user.instituicaoId!,
      };
      const comentario = await comentarioService.create(
        comentarioData as any,
        user
      );
      return res.status(201).json(comentario);
    } catch (error: any) {
      return res.status(403).json({ message: error.message });
    }
  },

  findAllByTarefa: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tarefaId } = req.query as { tarefaId: string };
      const comentarios = await comentarioService.findAllByTarefa(
        tarefaId,
        req.user
      );
      return res.status(200).json(comentarios);
    } catch (error: any) {
      return res.status(403).json({ message: error.message });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { conteudo } = req.body;
      const comentario = await comentarioService.update(id, conteudo, req.user);
      return res.status(200).json(comentario);
    } catch (error: any) {
      return res.status(403).json({ message: error.message });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      await comentarioService.remove(id, req.user);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(403).json({ message: error.message });
    }
  },
};
