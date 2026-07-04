import { Router } from 'express';
import {
  getStudentDashboard,
  getStudentProfile,
  updateStudentProfile,
  getParentDashboard,
  getParentChildren,
} from '../controllers/portal.controller';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Student Portal Routes (Authenticated & Restricted to STUDENTS)
router.get(
  '/student/dashboard',
  authenticate,
  requireRoles(['STUDENT']),
  getStudentDashboard
);
router.get(
  '/student/profile',
  authenticate,
  requireRoles(['STUDENT']),
  getStudentProfile
);
router.put(
  '/student/profile',
  authenticate,
  requireRoles(['STUDENT']),
  updateStudentProfile
);

// Parent Portal Routes (Authenticated & Restricted to PARENTS)
router.get(
  '/parent/dashboard',
  authenticate,
  requireRoles(['PARENT']),
  getParentDashboard
);
router.get(
  '/parent/children',
  authenticate,
  requireRoles(['PARENT']),
  getParentChildren
);
router.put(
  '/parent/profile',
  authenticate,
  requireRoles(['PARENT']),
  updateStudentProfile
);

export default router;
