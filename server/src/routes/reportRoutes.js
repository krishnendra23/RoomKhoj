import { Router } from 'express';
import { createReport } from '../controllers/reportController.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { reportCreateSchema } from '../validators/schemas.js';

const router = Router();

router.post('/', writeLimiter, optionalAuth, validateBody(reportCreateSchema), createReport);

export default router;
