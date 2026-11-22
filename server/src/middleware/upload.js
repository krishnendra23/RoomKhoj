import multer from 'multer';
import { AppError } from '../utils/apiResponse.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per image
const MAX_FILES_PER_UPLOAD = 10;

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new AppError('Only JPEG, PNG, and WEBP image formats are supported', 400),
      false
    );
  }
  return cb(null, true);
}

export const propertyPhotoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_UPLOAD,
  },
});
