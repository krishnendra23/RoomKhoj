import { Router } from 'express';
import {
  getLocalities,
  createLocality,
  updateLocality,
  deleteLocality,
} from '../controllers/localityController.js';
import { authenticate, optionalAuth, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { localitySchema } from '../validators/schemas.js';

const router = Router();

router.get('/', optionalAuth, getLocalities);
router.post('/', authenticate, authorize('admin'), validateBody(localitySchema), createLocality);
router.patch('/:id', authenticate, authorize('admin'), updateLocality);
router.delete('/:id', authenticate, authorize('admin'), deleteLocality);

export default router;
