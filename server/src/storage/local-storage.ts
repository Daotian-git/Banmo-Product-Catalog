import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

/**
 * 本地文件存储（开发环境使用）
 * 接口与 coze-coding-dev-sdk 的 S3Storage 保持一致
 */
@Injectable()
export class LocalStorage {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * 上传文件到本地
   * @returns 文件存储路径（作为 key）
   */
  async uploadFile(params: {
    fileContent: Buffer;
    fileName: string;
    contentType?: string;
  }): Promise<string> {
    this.ensureUploadDir();
    const filePath = path.join(this.uploadDir, params.fileName);

    // 确保子目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, params.fileContent);
    return params.fileName; // 返回相对路径作为 key
  }

  /**
   * 生成文件访问 URL（本地静态地址）
   */
  async generatePresignedUrl(params: { key: string }): Promise<string> {
    return `/uploads/${params.key}`;
  }

  /**
   * 删除本地文件
   */
  async deleteFile(params: { fileKey: string }) {
    const filePath = path.join(this.uploadDir, params.fileKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
