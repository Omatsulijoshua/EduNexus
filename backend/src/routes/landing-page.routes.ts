import { Router } from 'express';
import {
  getLandingPageConfig,
  updateLandingPageConfig,
  getPublicSchoolPortal,
} from '../controllers/landing-page.controller';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';

const router = Router();

// Public unauthenticated route to fetch a school's public landing page configuration
router.get('/public/school/:slug', getPublicSchoolPortal);

// Protected School Admin customizer endpoints
router.get(
  '/admin/landing-page',
  authenticate,
  requireRoles(['SCHOOL_ADMIN']),
  resolveTenant,
  getLandingPageConfig
);

router.put(
  '/admin/landing-page',
  authenticate,
  requireRoles(['SCHOOL_ADMIN']),
  resolveTenant,
  updateLandingPageConfig
);

export default router;
