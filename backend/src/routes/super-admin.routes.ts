import { Router } from 'express';
import {
  getSaaSAnalytics,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from '../controllers/super-admin.controller';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Protect all routes under this router for SUPER_ADMIN role
router.use(authenticate);
router.use(requireRoles(['SUPER_ADMIN']));

// Analytics route
router.get('/super-admin/analytics', getSaaSAnalytics);

// Subscription Plan CRUD routes
router.get('/super-admin/plans', getSubscriptionPlans);
router.post('/super-admin/plans', createSubscriptionPlan);
router.put('/super-admin/plans/:id', updateSubscriptionPlan);
router.delete('/super-admin/plans/:id', deleteSubscriptionPlan);

export default router;
