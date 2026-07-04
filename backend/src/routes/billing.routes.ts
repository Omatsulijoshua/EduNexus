import { Router } from 'express';
import { getActiveBilling, createCheckoutSession, confirmCheckout } from '../controllers/billing.controller';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';

const router = Router();

// Secure all billing routes under school admin context
router.get(
  '/billing/active',
  authenticate,
  requireRoles(['SCHOOL_ADMIN']),
  resolveTenant,
  getActiveBilling
);

router.post(
  '/billing/checkout',
  authenticate,
  requireRoles(['SCHOOL_ADMIN']),
  resolveTenant,
  createCheckoutSession
);

router.post(
  '/billing/confirm-checkout',
  authenticate,
  requireRoles(['SCHOOL_ADMIN']),
  resolveTenant,
  confirmCheckout
);

export default router;
