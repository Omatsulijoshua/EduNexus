import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/db';

export const checkSubscriptionLimit = (type: 'STUDENT' | 'TEACHER') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const schoolId = req.schoolId;

    if (!schoolId) {
      res.status(400).json({ error: 'School tenant context not found.' });
      return;
    }

    try {
      const subscription = await prisma.subscription.findFirst({
        where: { schoolId, status: 'ACTIVE' },
        include: { plan: true },
      });

      if (!subscription) {
        res.status(402).json({
          error: 'No active subscription found. Please subscribe to a plan to perform this action.',
          code: 'SUBSCRIPTION_REQUIRED',
        });
        return;
      }

      if (new Date() > subscription.endDate) {
        res.status(402).json({
          error: 'Your subscription plan has expired. Please renew your subscription to proceed.',
          code: 'SUBSCRIPTION_EXPIRED',
        });
        return;
      }

      if (type === 'STUDENT') {
        const studentCount = await prisma.studentProfile.count({
          where: { schoolId },
        });

        if (studentCount >= subscription.plan.maxStudents) {
          res.status(403).json({
            error: `Plan limits exceeded. Your plan allows a maximum of ${subscription.plan.maxStudents} students. Please upgrade your plan.`,
            code: 'STUDENT_LIMIT_EXCEEDED',
          });
          return;
        }
      }

      if (type === 'TEACHER') {
        const teacherCount = await prisma.teacherProfile.count({
          where: { schoolId },
        });

        if (teacherCount >= subscription.plan.maxTeachers) {
          res.status(403).json({
            error: `Plan limits exceeded. Your plan allows a maximum of ${subscription.plan.maxTeachers} teachers. Please upgrade your plan.`,
            code: 'TEACHER_LIMIT_EXCEEDED',
          });
          return;
        }
      }

      next();
    } catch (error) {
      console.error('Subscription limit check failed:', error);
      res.status(500).json({ error: 'Internal server error checking subscription limits.' });
    }
  };
};
