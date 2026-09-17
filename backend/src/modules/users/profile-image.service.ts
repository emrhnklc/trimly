import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const maxFileSizeBytes = 5 * 1024 * 1024;
const fileNamePattern = /^[0-9a-f-]{36}\.(jpg|png|webp)$/i;

type SupportedImage = {
  extension: 'jpg' | 'png' | 'webp';
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
};

@Injectable()
export class ProfileImageService {
  private readonly directory = resolve(
    process.cwd(),
    'uploads',
    'profile-photos',
  );

  async save(file: Express.Multer.File | undefined) {
    if (!file?.buffer) {
      throw new BadRequestException('Bir profil fotoğrafı gönderilmelidir.');
    }
    if (file.size > maxFileSizeBytes) {
      throw new BadRequestException('Profil fotoğrafı en fazla 5 MB olabilir.');
    }

    const image = this.detectSupportedImage(file.buffer);
    if (!image || file.mimetype !== image.mimeType) {
      throw new BadRequestException(
        'Yalnız JPEG, PNG veya WebP formatında geçerli bir fotoğraf yüklenebilir.',
      );
    }

    const fileName = `${randomUUID()}.${image.extension}`;
    await mkdir(this.directory, { recursive: true });
    await writeFile(this.pathFor(fileName), file.buffer, { flag: 'wx' });
    return { fileName };
  }

  async read(fileName: string) {
    if (!fileNamePattern.test(fileName)) {
      throw new NotFoundException('Profil fotoğrafı bulunamadı.');
    }

    try {
      const extension = fileName.split('.').pop();
      const mimeType =
        extension === 'png'
          ? 'image/png'
          : extension === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
      return { buffer: await readFile(this.pathFor(fileName)), mimeType };
    } catch {
      throw new NotFoundException('Profil fotoğrafı bulunamadı.');
    }
  }

  async deleteByUrl(url: string | null | undefined) {
    const fileName = this.fileNameFromUrl(url);
    if (!fileName) return;
    await unlink(this.pathFor(fileName)).catch(() => undefined);
  }

  private pathFor(fileName: string) {
    return resolve(this.directory, basename(fileName));
  }

  private fileNameFromUrl(url: string | null | undefined) {
    if (!url) return null;
    try {
      const fileName = new URL(url).pathname.split('/').pop();
      return fileName && fileNamePattern.test(fileName) ? fileName : null;
    } catch {
      return null;
    }
  }

  private detectSupportedImage(buffer: Buffer): SupportedImage | null {
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return { extension: 'jpg', mimeType: 'image/jpeg' };
    }
    if (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
      return { extension: 'png', mimeType: 'image/png' };
    }
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).equals(Buffer.from('RIFF')) &&
      buffer.subarray(8, 12).equals(Buffer.from('WEBP'))
    ) {
      return { extension: 'webp', mimeType: 'image/webp' };
    }
    return null;
  }
}
