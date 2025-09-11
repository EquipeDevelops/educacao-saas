import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export const processImage = async (filePath: string, originalName: string): Promise<string> => {
  const outputName = `tratada-${Date.now()}-${originalName}`;
  const outputPath = path.join(path.dirname(filePath), outputName);

 
  await sharp(filePath)
    .resize(800, 800, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .toFile(outputPath);

  // Remove o arquivo original
  await fs.unlink(filePath);

  return outputName;
};
