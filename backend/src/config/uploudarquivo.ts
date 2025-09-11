import { Request, Response } from 'express';
import { processImage } from '../config/fileService';

export const handleImageUpload = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }

    const result = await processImage(file.path, file.originalname);
    return res.status(200).json({ message: 'Imagem processada com sucesso.', result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
