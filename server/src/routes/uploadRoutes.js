import { Router } from 'express';
import { uploadPhotos, removeUploadedPhoto } from '../controllers/uploadController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { propertyPhotoUpload } from '../middleware/upload.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post(
  '/property-photos',
  writeLimiter,
  authenticate,
  authorize('owner', 'admin'),
  propertyPhotoUpload.array('photos', 10),
  uploadPhotos
);

router.delete(
  '/property-photos',
  authenticate,
  authorize('owner', 'admin'),
  removeUploadedPhoto
);

export default router;
