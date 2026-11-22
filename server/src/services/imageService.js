import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function uploadBufferToCloudinary(buffer, folder = 'roomkhoj/properties') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1600, height: 1200, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
}

export async function uploadPropertyImage(file) {
  if (!file || !file.buffer) {
    throw new AppError('No valid image file provided', 400);
  }

  if (env.storageProvider === 'cloudinary') {
    if (!isCloudinaryConfigured()) {
      throw new AppError(
        'Cloudinary image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env (or set STORAGE_PROVIDER=local for local development).',
        503
      );
    }
    return uploadBufferToCloudinary(file.buffer);
  }

  if (env.storageProvider === 'local') {
    if (env.isProduction) {
      throw new AppError(
        'Local file storage is disabled in production. Configure Cloudinary in server/.env.',
        503
      );
    }
    await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
    const filename = `rk-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const fullPath = path.join(LOCAL_UPLOAD_DIR, filename);
    await fs.writeFile(fullPath, file.buffer);
    return {
      url: `${env.publicApiUrl}/uploads/${filename}`,
      publicId: `local/${filename}`,
    };
  }

  throw new AppError(`Invalid STORAGE_PROVIDER: ${env.storageProvider}`, 500);
}

export async function deleteStoredImage(publicId) {
  if (!publicId || typeof publicId !== 'string') return;

  if (publicId.startsWith('local/')) {
    const filename = path.basename(publicId.replace('local/', ''));
    const fullPath = path.join(LOCAL_UPLOAD_DIR, filename);
    try {
      await fs.unlink(fullPath);
    } catch {
      // File may already be deleted
    }
    return;
  }

  // External stock URLs (e.g. seeded pilot listings) don't live in Cloudinary
  if (publicId.startsWith('seed/')) return;

  if (isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('[RoomKhoj Storage] Cloudinary destroy failed:', err.message);
    }
  }
}

export { LOCAL_UPLOAD_DIR };
