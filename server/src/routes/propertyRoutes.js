import { Router } from 'express';
import {
  getHomepageSections,
  searchProperties,
  getPropertyBySlug,
  trackContactClick,
  createProperty,
  getOwnerProperties,
  getOwnerPropertyById,
  updateProperty,
  updateAvailability,
  deleteProperty,
} from '../controllers/propertyController.js';
import { authenticate, optionalAuth, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { propertyPayloadSchema, availabilityUpdateSchema } from '../validators/schemas.js';

const router = Router();

// Public discovery routes (no login required)
router.get('/homepage', getHomepageSections);
router.get('/', searchProperties);

// Owner-protected routes (placed BEFORE /:slug so 'owner' isn't matched as a slug)
router.get('/owner/my-listings', authenticate, authorize('owner', 'admin'), getOwnerProperties);
router.get('/owner/:id', authenticate, authorize('owner', 'admin'), getOwnerPropertyById);
router.post(
  '/',
  writeLimiter,
  authenticate,
  authorize('owner', 'admin'),
  validateBody(propertyPayloadSchema),
  createProperty
);
router.put(
  '/:id',
  writeLimiter,
  authenticate,
  authorize('owner', 'admin'),
  validateBody(propertyPayloadSchema),
  updateProperty
);
router.patch(
  '/:id/availability',
  authenticate,
  authorize('owner', 'admin'),
  validateBody(availabilityUpdateSchema),
  updateAvailability
);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteProperty);

// Public detail & contact click tracking
router.post('/:id/contact-click', trackContactClick);
router.get('/:slug', optionalAuth, getPropertyBySlug);

export default router;
