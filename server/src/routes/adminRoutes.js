import { Router } from 'express';
import {
  getAdminStats,
  getAdminProperties,
  moderateProperty,
  adminDeleteProperty,
  getAdminUsers,
  updateUserStatus,
  getAdminReports,
  updateReportStatus,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  adminModerationSchema,
  adminUserStatusSchema,
  adminReportStatusSchema,
} from '../validators/schemas.js';

const router = Router();

// Strictly protect all admin APIs with JWT + admin role verification
router.use(authenticate, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/properties', getAdminProperties);
router.patch('/properties/:id/moderate', validateBody(adminModerationSchema), moderateProperty);
router.delete('/properties/:id', adminDeleteProperty);

router.get('/users', getAdminUsers);
router.patch('/users/:id/status', validateBody(adminUserStatusSchema), updateUserStatus);

router.get('/reports', getAdminReports);
router.patch('/reports/:id', validateBody(adminReportStatusSchema), updateReportStatus);

export default router;
