
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { storageService } from './fileService';
import { prisma } from './prisma'; 


declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}


const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const router = Router();


router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    
    const storedName = await storageService.uploadFile(req.file);

  
    const newFile = await prisma.file.create({
      data: {
        originalName: req.file.originalname,
        storedName: storedName,
        path: `uploads/${storedName}`, 
      },
    });

    res.status(200).json({
      message: 'Arquivo enviado e salvo no BD com sucesso!',
      fileId: newFile.id,
      fileName: newFile.storedName,
    });
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

export default router;