import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extensao = path.extname(file.originalname);
    const chave = file.fieldname + "-" + uniqueSuffix + extensao;

    (req.file as any) = { ...req.file, key: chave };

    cb(null, chave);
  },
});

export const upload = multer({ storage: storage });
