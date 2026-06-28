import { Router } from 'express';
import { getAllSchools, updateSchoolStatus, getSchoolProfile, updateSchoolProfile } from '../controllers/school.controller';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';

const router = Router();

// 👑 Super Admin routes
router.get(
  '/super-admin/schools',
  authenticate,
  requireRoles(['SUPER_ADMIN']),
  getAllSchools
);

router.patch(
  '/super-admin/schools/:id/status',
  authenticate,
  requireRoles(['SUPER_ADMIN']),
  updateSchoolStatus
);

// 🏫 School Admin routes
router.get(
  '/admin/school/profile',
  authenticate,
  requireRoles(['SCHOOL_ADMIN']),
  resolveTenant,
  getSchoolProfile
);

router.put(
  '/admin/school/profile',
  authenticate,
  requireRoles(['SCHOOL_ADMIN']),
  resolveTenant,
  updateSchoolProfile
);

export default router;
