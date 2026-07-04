import { Router } from 'express';
import { getMasterSheet, getReportSheet } from '../controllers/report.controller';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';

const router = Router();

// Master Sheet is restricted to SCHOOL_ADMIN role under strict tenant context
router.get(
  '/reports/master-sheet',
  authenticate,
  requireRoles(['SCHOOL_ADMIN']),
  resolveTenant,
  getMasterSheet
);

// Report Sheet is accessible to Admin, Parent, or Student (controller checks ownership)
router.get(
  '/reports/report-sheet',
  authenticate,
  getReportSheet
);

export default router;
