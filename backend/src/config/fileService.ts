
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

export interface StorageService {
  uploadFile(file: Express.Multer.File): Promise<string>;
  deleteFile(fileName: string): Promise<void>;
}


class S3StorageService implements StorageService {
  private s3Client: S3Client;
  private BUCKET_NAME: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
    this.BUCKET_NAME = process.env.S3_BUCKET_NAME as string;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const key = `${Date.now()}-${file.originalname}`;
    const uploadParams = {
      Bucket: this.BUCKET_NAME,
      Key: key,
      Body: file.buffer,
    };
    await this.s3Client.send(new PutObjectCommand(uploadParams));
    return key;
  }

  async deleteFile(fileName: string): Promise<void> {
    const deleteParams = {
      Bucket: this.BUCKET_NAME,
      Key: fileName,
    };
    await this.s3Client.send(new DeleteObjectCommand(deleteParams));
  }
}


class LocalStorageService implements StorageService {
  private uploadDir = path.join(__dirname, '../../uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);
    return fileName;
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(this.uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}


let storageService: StorageService;
if (process.env.NODE_ENV === 'production') {
  storageService = new S3StorageService();
} else {
  storageService = new LocalStorageService();
}

export { storageService };