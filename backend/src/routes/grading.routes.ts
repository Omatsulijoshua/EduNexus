import { Router } from 'express';
import { getGradeBook, submitGrades } from '../controllers/grading.controller';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Teacher Grading routes (Authenticated & Restricted to TEACHERS)
router.get(
  '/teacher/grades',
  authenticate,
  requireRoles(['TEACHER']),
  getGradeBook
);

router.post(
  '/teacher/grades',
  authenticate,
  requireRoles(['TEACHER']),
  submitGrades
);

export default router;
