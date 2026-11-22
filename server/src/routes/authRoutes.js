import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  sendOtp,
  verifyOtp,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from '../validators/schemas.js';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.get('/me', authenticate, getProfile);
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateProfile);
router.post('/send-otp', authLimiter, authenticate, sendOtp);
router.post('/verify-otp', authLimiter, authenticate, validateBody(verifyOtpSchema), verifyOtp);

export default router;
